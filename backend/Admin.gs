/**
 * Admin.gs
 * All administrator-only read/write operations. Every function here starts
 * by calling requireAdmin_(idToken) — never trust a client-asserted role.
 */

function getSettingsMap_() {
  var sheet = getSheet_(SHEET_NAMES.SETTINGS);
  var values = sheet.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) {
    if (values[i][0]) map[values[i][0]] = values[i][1];
  }
  return map;
}

/** Public settings — safe subset only (never leaks admin-only fields). */
function getPublicSettings_() {
  var s = getSettingsMap_();
  var votingState = getVotingStatus_();
  return {
    pageantName: s.pageant_name,
    edition: s.edition,
    theme: s.theme,
    startDatetime: s.start_datetime,
    endDatetime: s.end_datetime,
    timezone: s.timezone || TIMEZONE,
    votingStatus: votingState.status,
    resultsReleased: String(s.results_released).toLowerCase() === 'true',
    currentVotingDay: votingState.status !== VOTING_STATUS.NOT_STARTED
      ? currentVotingDayNumber_(votingState.start, votingState.now)
      : 0
  };
}

/** ADMIN: overview statistics. */
function adminOverview_(idToken) {
  requireAdmin_(idToken);
  var settings = getSettingsMap_();
  var votingState = getVotingStatus_();
  var totalDays = diffDaysInclusive_(votingState.start, votingState.end);
  var dayNum = votingState.status === VOTING_STATUS.NOT_STARTED ? 0 : currentVotingDayNumber_(votingState.start, votingState.now);
  var daysCompleted = Math.min(Math.max(dayNum - (votingState.status === VOTING_STATUS.OPEN ? 1 : 0), 0), totalDays);
  var daysRemaining = Math.max(totalDays - dayNum + (votingState.status === VOTING_STATUS.OPEN ? 1 : 0), 0);

  var todayKey = currentVotingDayKey_();
  var votes = readSheetAsObjects_(getSheet_(SHEET_NAMES.VOTES)).filter(function (v) { return v.status === 'valid'; });
  var todayVotes = votes.filter(function (v) { return v.voting_day === todayKey; });
  var todayUniqueVoters = uniqueBy_(todayVotes, 'email_hash').length;
  var suspiciousOpen = readSheetAsObjects_(getSheet_(SHEET_NAMES.SUSPICIOUS)).filter(function (s) { return s.status === 'OPEN'; }).length;

  return {
    votingStatus: votingState.status,
    currentVotingDay: dayNum,
    totalDays: totalDays,
    daysCompleted: daysCompleted,
    daysRemaining: daysRemaining,
    todayTotalVotes: todayVotes.length,
    todayUniqueVoters: todayUniqueVoters,
    totalVotesSinceStart: votes.length,
    suspiciousActivityCount: suspiciousOpen,
    pageantName: settings.pageant_name,
    edition: settings.edition
  };
}

function diffDaysInclusive_(start, end) {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  var startDay = new Date(Utilities.formatDate(start, TIMEZONE, "yyyy-MM-dd'T'00:00:00"));
  var endDay = new Date(Utilities.formatDate(end, TIMEZONE, "yyyy-MM-dd'T'00:00:00"));
  return Math.floor((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1;
}

function uniqueBy_(arr, key) {
  var seen = {};
  var out = [];
  arr.forEach(function (item) {
    if (!seen[item[key]]) {
      seen[item[key]] = true;
      out.push(item);
    }
  });
  return out;
}

/** ADMIN: voting control — update start/end/timezone. */
function adminUpdateVotingControl_(idToken, payload) {
  var admin = requireAdmin_(idToken);
  var start = new Date(payload.startDatetime);
  var end = new Date(payload.endDatetime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new AppError_('INVALID_DATES', 'Invalid date configuration. The end date must be after the start date.');
  }
  setSetting_('start_datetime', start.toISOString());
  setSetting_('end_datetime', end.toISOString());
  setSetting_('timezone', payload.timezone || TIMEZONE);
  logAudit_(admin, 'VOTING_SETTINGS_CHANGED', '', payload);
  return getPublicSettings_();
}

function setSetting_(key, value) {
  var sheet = getSheet_(SHEET_NAMES.SETTINGS);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

/** ADMIN: general settings update (theme, pageant name, etc.) */
function adminUpdateSettings_(idToken, payload) {
  var admin = requireAdmin_(idToken);
  Object.keys(payload).forEach(function (key) {
    setSetting_(key, payload[key]);
  });
  logAudit_(admin, 'SETTINGS_UPDATED', '', payload);
  return getPublicSettings_();
}

/** ADMIN: results for one voting day (Day N or an explicit date key). */
function adminDailyResults_(idToken, votingDayKey) {
  requireAdmin_(idToken);
  var rows = readSheetAsObjects_(getSheet_(SHEET_NAMES.DAILY_RESULTS))
    .filter(function (r) { return r.voting_day === votingDayKey; });

  var totalVotes = rows.reduce(function (sum, r) { return sum + Number(r.vote_count || 0); }, 0);
  var votes = readSheetAsObjects_(getSheet_(SHEET_NAMES.VOTES))
    .filter(function (v) { return v.voting_day === votingDayKey && v.status === 'valid'; });
  var uniqueVoters = uniqueBy_(votes, 'email_hash').length;

  var ranked = rows
    .map(function (r) {
      return {
        contestantId: r.contestant_id,
        contestantName: r.contestant_name,
        category: r.category,
        voteCount: Number(r.vote_count || 0),
        percentage: totalVotes > 0 ? Math.round((Number(r.vote_count || 0) / totalVotes) * 1000) / 10 : 0
      };
    })
    .sort(function (a, b) { return b.voteCount - a.voteCount; });

  return {
    votingDay: votingDayKey,
    totalVotes: totalVotes,
    uniqueVoters: uniqueVoters,
    results: ranked
  };
}

/** ADMIN: list of all voting days that have data, plus the configured range. */
function adminVotingDaysList_(idToken) {
  requireAdmin_(idToken);
  var settings = getSettingsMap_();
  var start = new Date(settings.start_datetime);
  var end = new Date(settings.end_datetime);
  var totalDays = diffDaysInclusive_(start, end);
  var days = [];
  for (var i = 0; i < totalDays; i++) {
    var d = new Date(start.getTime());
    d.setDate(d.getDate() + i);
    days.push({
      dayNumber: i + 1,
      votingDay: Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd')
    });
  }
  return days;
}

/** ADMIN: voter monitoring with filters. */
function adminListVoters_(idToken, filters) {
  requireAdmin_(idToken);
  filters = filters || {};
  var votes = readSheetAsObjects_(getSheet_(SHEET_NAMES.VOTES));

  var filtered = votes.filter(function (v) {
    if (filters.votingDay && v.voting_day !== filters.votingDay) return false;
    if (filters.contestantId && v.contestant_id !== filters.contestantId) return false;
    if (filters.status && v.status !== filters.status) return false;
    return true;
  });

  var voters = readSheetAsObjects_(getSheet_(SHEET_NAMES.VOTERS));
  var voterById = {};
  voters.forEach(function (v) { voterById[v.voter_id] = v; });

  return filtered.map(function (v) {
    var voter = voterById[v.voter_id];
    return {
      votingDay: v.voting_day,
      timestamp: v.timestamp,
      contestantName: v.contestant_name,
      status: v.status,
      maskedEmail: voter ? maskEmail_(voter.email) : '***'
    };
  }).sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
}

/** ADMIN: suspicious activity log. */
function adminSuspiciousActivity_(idToken) {
  requireAdmin_(idToken);
  return readSheetAsObjects_(getSheet_(SHEET_NAMES.SUSPICIOUS)).map(function (s) {
    return {
      timestamp: s.timestamp,
      emailHash: s.email_hash,
      deviceHash: s.device_hash,
      event: s.event,
      riskLevel: s.risk_level,
      details: s.details,
      status: s.status
    };
  }).sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
}

/** ADMIN: mark a suspicious activity entry as reviewed. */
function adminReviewSuspicious_(idToken, timestamp, emailHash, newStatus) {
  var admin = requireAdmin_(idToken);
  var sheet = getSheet_(SHEET_NAMES.SUSPICIOUS);
  var headers = getHeaders_(sheet);
  var rows = readSheetAsObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].timestamp === timestamp && rows[i].email_hash === emailHash) {
      sheet.getRange(rows[i].__row, headers.indexOf('status') + 1).setValue(newStatus);
      logAudit_(admin, 'SUSPICIOUS_ACTIVITY_REVIEWED', emailHash, { newStatus: newStatus });
      return { updated: true };
    }
  }
  throw new AppError_('NOT_FOUND', 'Record not found.');
}

/** ADMIN: audit log listing. */
function adminAuditLogs_(idToken) {
  requireAdmin_(idToken);
  return readSheetAsObjects_(getSheet_(SHEET_NAMES.AUDIT_LOG)).map(function (a) {
    return {
      timestamp: a.timestamp,
      admin: a.admin,
      action: a.action,
      target: a.target,
      details: a.details
    };
  }).sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
}

/**
 * ADMIN: compute and release final overall results. Idempotent snapshot —
 * safe to call again, but historical vote rows are never altered.
 */
function adminReleaseFinalResults_(idToken) {
  var admin = requireAdmin_(idToken);
  var votes = readSheetAsObjects_(getSheet_(SHEET_NAMES.VOTES)).filter(function (v) { return v.status === 'valid'; });

  var totals = {}; // contestantId -> { name, category, count }
  votes.forEach(function (v) {
    if (!totals[v.contestant_id]) {
      totals[v.contestant_id] = { contestantId: v.contestant_id, name: v.contestant_name, category: v.category, count: 0 };
    }
    totals[v.contestant_id].count += 1;
  });

  var byCategory = {};
  Object.keys(totals).forEach(function (id) {
    var t = totals[id];
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  var categoryTotalVotes = {};
  Object.keys(byCategory).forEach(function (cat) {
    categoryTotalVotes[cat] = byCategory[cat].reduce(function (s, t) { return s + t.count; }, 0);
    byCategory[cat].sort(function (a, b) { return b.count - a.count; });
    byCategory[cat].forEach(function (t, idx) {
      t.position = idx + 1;
      t.percentage = categoryTotalVotes[cat] > 0 ? Math.round((t.count / categoryTotalVotes[cat]) * 1000) / 10 : 0;
    });
  });

  setSetting_('results_released', 'true');
  setSetting_('results_released_at', nowIso_());
  logAudit_(admin, 'FINAL_RESULTS_RELEASED', '', { totalValidVotes: votes.length });

  return byCategory;
}

/** PUBLIC: final results — only returns data once results_released is true. */
function getPublicFinalResults_() {
  var settings = getSettingsMap_();
  if (String(settings.results_released).toLowerCase() !== 'true') {
    throw new AppError_('RESULTS_NOT_RELEASED', 'Results are not yet available.');
  }
  return adminReleaseFinalResultsReadOnly_();
}

/** Same computation as adminReleaseFinalResults_ but never writes — used for public reads after release. */
function adminReleaseFinalResultsReadOnly_() {
  var votes = readSheetAsObjects_(getSheet_(SHEET_NAMES.VOTES)).filter(function (v) { return v.status === 'valid'; });
  var totals = {};
  votes.forEach(function (v) {
    if (!totals[v.contestant_id]) {
      totals[v.contestant_id] = { contestantId: v.contestant_id, name: v.contestant_name, category: v.category, count: 0 };
    }
    totals[v.contestant_id].count += 1;
  });
  var byCategory = {};
  Object.keys(totals).forEach(function (id) {
    var t = totals[id];
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });
  Object.keys(byCategory).forEach(function (cat) {
    var total = byCategory[cat].reduce(function (s, t) { return s + t.count; }, 0);
    byCategory[cat].sort(function (a, b) { return b.count - a.count; });
    byCategory[cat].forEach(function (t, idx) {
      t.position = idx + 1;
      t.percentage = total > 0 ? Math.round((t.count / total) * 1000) / 10 : 0;
    });
  });
  return byCategory;
}

/** ADMIN: export all valid vote records (for backup / CSV export in the dashboard). */
function adminExportVotes_(idToken) {
  requireAdmin_(idToken);
  var rows = readSheetAsObjects_(getSheet_(SHEET_NAMES.VOTES));
  return rows.map(function (v) {
    return {
      voteId: v.vote_id,
      contestantName: v.contestant_name,
      category: v.category,
      votingDay: v.voting_day,
      timestamp: v.timestamp,
      status: v.status
    };
  });
}
