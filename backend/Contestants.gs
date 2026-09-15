/**
 * Contestants.gs
 * Public contestant reads, plus admin create/update/disable operations.
 */

function getActiveContestants_() {
  var sheet = getSheet_(SHEET_NAMES.CONTESTANTS);
  var rows = readSheetAsObjects_(sheet);
  return rows
    .filter(function (c) { return String(c.status).toLowerCase() === 'active'; })
    .map(publicContestant_)
    .sort(function (a, b) { return a.contestantNumber - b.contestantNumber; });
}

function getContestantDetails_(contestantId) {
  var contestant = findContestantById_(contestantId);
  if (!contestant || String(contestant.status).toLowerCase() !== 'active') {
    throw new AppError_('CONTESTANT_NOT_FOUND', 'Contestant unavailable.');
  }
  return publicContestant_(contestant);
}

function findContestantById_(contestantId) {
  var sheet = getSheet_(SHEET_NAMES.CONTESTANTS);
  var rows = readSheetAsObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].contestant_id) === String(contestantId)) return rows[i];
  }
  return null;
}

function publicContestant_(c) {
  return {
    contestantId: c.contestant_id,
    contestantNumber: c.contestant_number,
    name: c.name,
    category: c.category,
    biography: c.biography,
    photoUrl: c.photo_url
  };
}

/** ADMIN: create or update a contestant. */
function adminSaveContestant_(idToken, payload) {
  var admin = requireAdmin_(idToken);
  var sheet = getSheet_(SHEET_NAMES.CONTESTANTS);
  var headers = getHeaders_(sheet);
  var rows = readSheetAsObjects_(sheet);

  if (payload.contestantId) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].contestant_id === payload.contestantId) {
        var updates = {
          contestant_number: payload.contestantNumber,
          name: payload.name,
          category: payload.category,
          biography: payload.biography,
          photo_url: payload.photoUrl,
          status: payload.status || rows[i].status,
          updated_at: nowIso_()
        };
        Object.keys(updates).forEach(function (key) {
          if (updates[key] !== undefined) {
            sheet.getRange(rows[i].__row, headers.indexOf(key) + 1).setValue(updates[key]);
          }
        });
        logAudit_(admin, 'CONTESTANT_UPDATED', payload.contestantId, updates);
        return { contestantId: payload.contestantId };
      }
    }
    throw new AppError_('CONTESTANT_NOT_FOUND', 'Contestant not found.');
  }

  var newId = newId_('contestant');
  appendRowFromObject_(sheet, headers, {
    contestant_id: newId,
    contestant_number: payload.contestantNumber,
    name: payload.name,
    category: payload.category,
    biography: payload.biography,
    photo_url: payload.photoUrl,
    status: 'active',
    created_at: nowIso_(),
    updated_at: nowIso_()
  });
  logAudit_(admin, 'CONTESTANT_CREATED', newId, payload);
  return { contestantId: newId };
}

/** ADMIN: disable a contestant (never deletes historical votes). */
function adminDisableContestant_(idToken, contestantId) {
  var admin = requireAdmin_(idToken);
  var sheet = getSheet_(SHEET_NAMES.CONTESTANTS);
  var headers = getHeaders_(sheet);
  var rows = readSheetAsObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].contestant_id === contestantId) {
      sheet.getRange(rows[i].__row, headers.indexOf('status') + 1).setValue('disabled');
      sheet.getRange(rows[i].__row, headers.indexOf('updated_at') + 1).setValue(nowIso_());
      logAudit_(admin, 'CONTESTANT_DISABLED', contestantId, {});
      return { contestantId: contestantId, status: 'disabled' };
    }
  }
  throw new AppError_('CONTESTANT_NOT_FOUND', 'Contestant not found.');
}

/** ADMIN: full contestant list including inactive, for the dashboard. */
function adminListContestants_(idToken) {
  requireAdmin_(idToken);
  var sheet = getSheet_(SHEET_NAMES.CONTESTANTS);
  return readSheetAsObjects_(sheet).map(function (c) {
    return {
      contestantId: c.contestant_id,
      contestantNumber: c.contestant_number,
      name: c.name,
      category: c.category,
      biography: c.biography,
      photoUrl: c.photo_url,
      status: c.status
    };
  });
}
