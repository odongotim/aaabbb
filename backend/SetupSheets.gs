/**
 * SetupSheets.gs
 * Run setupDatabase() ONCE from the Apps Script editor (select the function
 * in the toolbar dropdown and click Run) to create a fresh, private
 * spreadsheet with all required sheets, headers, protections, and default
 * settings. The resulting Spreadsheet ID is saved to Script Properties
 * automatically, so Config.gs will find it.
 */

function setupDatabase() {
  var ss = SpreadsheetApp.create('Lira University Pageantry - Voting Database');

  // Keep the spreadsheet private: do not publish, do not share beyond the
  // Apps Script project's own access. (Apps Script itself accesses it via
  // the ID regardless of sharing, since it runs as the deploying user.)

  createSheet_(ss, SHEET_NAMES.VOTERS, [
    'voter_id', 'email', 'email_verified', 'device_hash', 'first_seen', 'last_vote_date', 'status', 'created_at'
  ]);

  createSheet_(ss, SHEET_NAMES.VOTES, [
    'vote_id', 'voter_id', 'email_hash', 'contestant_id', 'contestant_name', 'category', 'voting_day', 'timestamp', 'device_hash', 'status'
  ]);

  createSheet_(ss, SHEET_NAMES.CONTESTANTS, [
    'contestant_id', 'contestant_number', 'name', 'category', 'biography', 'photo_url', 'status', 'created_at', 'updated_at'
  ]);

  var settingsSheet = createSheet_(ss, SHEET_NAMES.SETTINGS, ['setting', 'value']);
  var defaults = [
    ['pageant_name', 'Lira University Pageantry'],
    ['edition', '4th Edition'],
    ['theme', ''],
    ['start_datetime', ''],
    ['end_datetime', ''],
    ['timezone', TIMEZONE],
    ['voting_status', VOTING_STATUS.NOT_STARTED],
    ['results_released', 'false']
  ];
  settingsSheet.getRange(2, 1, defaults.length, 2).setValues(defaults);

  createSheet_(ss, SHEET_NAMES.AUDIT_LOG, ['timestamp', 'admin', 'action', 'target', 'details']);

  createSheet_(ss, SHEET_NAMES.SUSPICIOUS, ['timestamp', 'email_hash', 'device_hash', 'event', 'risk_level', 'details', 'status']);

  createSheet_(ss, SHEET_NAMES.DAILY_RESULTS, ['voting_day', 'contestant_id', 'contestant_name', 'category', 'vote_count', 'last_updated']);

  // Remove the default blank first sheet Apps Script creates.
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);

  // Protect sensitive sheets from accidental manual edits. The owner
  // (script author) retains access; nobody else is added.
  protectSheet_(ss.getSheetByName(SHEET_NAMES.VOTES), 'Votes are managed only by the voting system.');
  protectSheet_(ss.getSheetByName(SHEET_NAMES.AUDIT_LOG), 'Audit log is managed only by the system.');
  protectSheet_(ss.getSheetByName(SHEET_NAMES.VOTERS), 'Voter records are managed only by the voting system.');

  PropertiesService.getScriptProperties().setProperty(SPREADSHEET_ID_PROPERTY, ss.getId());

  Logger.log('Database created: ' + ss.getUrl());
  Logger.log('Spreadsheet ID (already saved to Script Properties): ' + ss.getId());
  return ss.getId();
}

function createSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sheet;
}

function protectSheet_(sheet, description) {
  var protection = sheet.protect().setDescription(description);
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) protection.setDomainEdit(false);
}

/**
 * Optional helper: run manually to add a few sample contestants for
 * testing. Safe to skip in production.
 */
function seedSampleContestants() {
  var sheet = getSheet_(SHEET_NAMES.CONTESTANTS);
  var headers = getHeaders_(sheet);
  var samples = [
    { contestant_number: 1, name: 'Sample Contestant A', category: 'Female', biography: 'Second-year Business student.', photo_url: '' },
    { contestant_number: 2, name: 'Sample Contestant B', category: 'Male', biography: 'Third-year Engineering student.', photo_url: '' }
  ];
  samples.forEach(function (s) {
    appendRowFromObject_(sheet, headers, Object.assign({
      contestant_id: newId_('contestant'),
      status: 'active',
      created_at: nowIso_(),
      updated_at: nowIso_()
    }, s));
  });
}
