/**
 * PublicCache.gs
 * Fast public reads. Public settings and active contestants are cached so
 * normal visitors do not hit Google Sheets on every page load.
 */

var PUBLIC_SETTINGS_CACHE_KEY = 'public_settings_v1';
var PUBLIC_CONTESTANTS_CACHE_KEY = 'public_contestants_v1';
var PUBLIC_CACHE_TTL_SECONDS = 300; // 5 minutes

function getPublicBootstrap_() {
  return {
    settings: getCachedPublicSettings_(),
    contestants: getCachedActiveContestants_()
  };
}

function getCachedPublicSettings_() {
  var cached = CACHE.get(PUBLIC_SETTINGS_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  var db = getDb_();
  var sheet = db.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) throw new Error('Missing required Settings sheet.');

  var values = sheet.getDataRange().getValues();
  var s = {};
  for (var i = 1; i < values.length; i++) {
    if (values[i][0]) s[values[i][0]] = values[i][1];
  }

  var votingState = getVotingStatus_();
  var result = {
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

  CACHE.put(PUBLIC_SETTINGS_CACHE_KEY, JSON.stringify(result), PUBLIC_CACHE_TTL_SECONDS);
  return result;
}

function getCachedActiveContestants_() {
  var cached = CACHE.get(PUBLIC_CONTESTANTS_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  var db = getDb_();
  var sheet = db.getSheetByName(SHEET_NAMES.CONTESTANTS);
  if (!sheet) throw new Error('Missing required Contestants sheet.');

  var values = sheet.getDataRange().getValues();
  var contestants = [];
  if (values.length >= 2) {
    var headers = values[0];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (row.join('') === '') continue;
      var c = {};
      for (var col = 0; col < headers.length; col++) c[headers[col]] = row[col];
      if (String(c.status).toLowerCase() === 'active') contestants.push(publicContestant_(c));
    }
  }

  contestants.sort(function (a, b) {
    return Number(a.contestantNumber) - Number(b.contestantNumber);
  });

  CACHE.put(PUBLIC_CONTESTANTS_CACHE_KEY, JSON.stringify(contestants), PUBLIC_CACHE_TTL_SECONDS);
  return contestants;
}

function invalidatePublicCache_() {
  CACHE.remove(PUBLIC_SETTINGS_CACHE_KEY);
  CACHE.remove(PUBLIC_CONTESTANTS_CACHE_KEY);
}
