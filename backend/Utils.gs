/**
 * Utils.gs
 * Shared helpers: JSON responses, hashing, masking, sheet row helpers,
 * and safe locking.
 */

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return jsonResponse_({ success: true, data: data || null });
}

function fail_(code, message) {
  return jsonResponse_({ success: false, error: { code: code, message: message } });
}

/**
 * Wraps a function with a script lock so concurrent requests (e.g. two
 * simultaneous vote submissions) cannot race each other.
 */
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  var acquired = lock.tryLock(10000);
  if (!acquired) {
    throw new AppError_('LOCK_TIMEOUT', 'The system is busy. Please try again in a moment.');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * A structured error that carries a stable machine-readable code plus a
 * user-safe message. Never let raw exceptions/stack traces reach clients.
 */
function AppError_(code, message) {
  this.code = code;
  this.message = message;
}
AppError_.prototype = Object.create(Error.prototype);

function sha256Hex_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value));
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function maskEmail_(email) {
  if (!email || email.indexOf('@') === -1) return '***';
  var parts = email.split('@');
  var local = parts[0];
  var visible = local.substring(0, Math.min(2, local.length));
  return visible + '***@' + parts[1];
}

function nowIso_() {
  return new Date().toISOString();
}

/** Returns YYYY-MM-DD for "today" in the configured timezone. */
function currentVotingDayKey_() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
}

function newId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
}

/** Reads a sheet's data as an array of objects keyed by header row. */
function readSheetAsObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue; // skip fully blank rows
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    obj.__row = i + 1; // 1-indexed sheet row number, for updates
    rows.push(obj);
  }
  return rows;
}

function appendRowFromObject_(sheet, headers, obj) {
  var row = headers.map(function (h) {
    return obj.hasOwnProperty(h) ? obj[h] : '';
  });
  sheet.appendRow(row);
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

/** Safe wrapper so every API entry point returns a clean JSON error, ever. */
function safeHandle_(fn) {
  try {
    var result = fn();
    return ok_(result);
  } catch (err) {
    if (err instanceof AppError_) {
      return fail_(err.code, err.message);
    }
    Logger.log('Unhandled error: ' + (err && err.stack ? err.stack : err));
    return fail_('INTERNAL_ERROR', 'System temporarily unavailable. Please try again shortly.');
  }
}

function logAudit_(admin, action, target, details) {
  var sheet = getSheet_(SHEET_NAMES.AUDIT_LOG);
  sheet.appendRow([nowIso_(), admin || 'system', action, target || '', details ? JSON.stringify(details) : '']);
}

function logSuspicious_(emailHash, deviceHash, event, riskLevel, details) {
  var sheet = getSheet_(SHEET_NAMES.SUSPICIOUS);
  sheet.appendRow([nowIso_(), emailHash || '', deviceHash || '', event, riskLevel, details ? JSON.stringify(details) : '', 'OPEN']);
}
