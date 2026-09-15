/**
 * Config.gs
 * Central configuration for the Lira University Pageantry voting backend.
 *
 * IMPORTANT: Set SPREADSHEET_ID below after running SetupSheets.gs (or after
 * creating the spreadsheet yourself), and set ADMIN_EMAILS with the Google
 * account emails allowed to access the admin dashboard.
 */

// -------------------------------------------------------------------------
// EDIT THESE VALUES FOR YOUR DEPLOYMENT
// -------------------------------------------------------------------------

// The ID of the Google Spreadsheet used as the database (from its URL).
// Leave blank and run setupDatabase() once from the Apps Script editor to
// create a fresh spreadsheet automatically; the ID will be logged and
// written to Script Properties for you.
var SPREADSHEET_ID_PROPERTY = 'SPREADSHEET_ID';

// Google account emails permitted to use the admin dashboard.
// Voters authenticate with their own Google account; admins are recognized
// only if their verified email appears in this list (or in the Admins sheet
// property — see Admin.gs / isAdminEmail_).
var ADMIN_EMAILS = [
  'admin@example.com'
];

var TIMEZONE = 'Africa/Kampala';

var SHEET_NAMES = {
  VOTERS: 'Voters',
  VOTES: 'Votes',
  CONTESTANTS: 'Contestants',
  SETTINGS: 'Settings',
  AUDIT_LOG: 'AuditLog',
  SUSPICIOUS: 'SuspiciousActivity',
  DAILY_RESULTS: 'DailyResults'
};

var VOTING_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};

// Rate limiting thresholds (see Security.gs)
var RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE_PER_KEY: 8,
  MAX_FAILED_VOTES_PER_HOUR: 6
};

/**
 * Returns the active Spreadsheet object, resolving the ID from Script
 * Properties (falling back to a bound spreadsheet if run inside one).
 */
function getDb_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(SPREADSHEET_ID_PROPERTY);
  if (!id) {
    throw new Error('SPREADSHEET_ID is not configured. Run setupDatabase() from SetupSheets.gs first.');
  }
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  var ss = getDb_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Missing required sheet: ' + name);
  }
  return sheet;
}
