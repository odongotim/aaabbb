/**
 * Auth.gs
 * Verifies Google Sign-In ID tokens sent from the React frontend and
 * resolves them to a verified voter email. The frontend is never trusted
 * to assert who the user is — every vote-affecting call re-verifies the
 * token server side.
 *
 * Set GOOGLE_CLIENT_ID to the OAuth Client ID configured in Google Cloud
 * Console for the "Sign in with Google" button used by the frontend.
 */

var GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';

/**
 * Verifies a Google Identity Services ID token using Google's tokeninfo
 * endpoint, and returns { email, emailVerified, sub, name }.
 * Throws AppError_('AUTH_FAILED', ...) on any problem.
 */
function verifyGoogleIdToken_(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new AppError_('AUTH_REQUIRED', 'Please sign in with Google to continue.');
  }

  var response;
  try {
    response = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
      { muteHttpExceptions: true }
    );
  } catch (e) {
    throw new AppError_('AUTH_FAILED', 'Authentication failed. Please try again.');
  }

  if (response.getResponseCode() !== 200) {
    throw new AppError_('AUTH_FAILED', 'Authentication failed. Please sign in again.');
  }

  var payload = JSON.parse(response.getContentText());

  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new AppError_('AUTH_FAILED', 'Authentication failed. Please sign in again.');
  }
  if (!payload.email || payload.email_verified !== 'true' && payload.email_verified !== true) {
    throw new AppError_('EMAIL_NOT_VERIFIED', 'A verified email address is required to vote.');
  }
  var exp = parseInt(payload.exp, 10);
  if (!exp || Date.now() / 1000 > exp) {
    throw new AppError_('AUTH_FAILED', 'Your sign-in session has expired. Please sign in again.');
  }

  return {
    email: String(payload.email).toLowerCase().trim(),
    emailVerified: true,
    sub: payload.sub,
    name: payload.name || ''
  };
}

/**
 * Finds or creates the Voters row for a verified email, returns the row
 * object (with __row for updates).
 */
function findOrCreateVoter_(email, deviceHash) {
  var sheet = getSheet_(SHEET_NAMES.VOTERS);
  var rows = readSheetAsObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].email).toLowerCase() === email) {
      return rows[i];
    }
  }
  var voterId = newId_('voter');
  var record = {
    voter_id: voterId,
    email: email,
    email_verified: true,
    device_hash: deviceHash || '',
    first_seen: nowIso_(),
    last_vote_date: '',
    status: 'active',
    created_at: nowIso_()
  };
  appendRowFromObject_(sheet, getHeaders_(sheet), record);
  record.__row = sheet.getLastRow();
  return record;
}

/** Checks whether an authenticated email belongs to an administrator. */
function isAdminEmail_(email) {
  if (!email) return false;
  var normalized = String(email).toLowerCase().trim();
  for (var i = 0; i < ADMIN_EMAILS.length; i++) {
    if (String(ADMIN_EMAILS[i]).toLowerCase().trim() === normalized) return true;
  }
  return false;
}

/**
 * Verifies an admin request: valid Google ID token AND email in the admin
 * allowlist. Throws on failure. Returns the verified email.
 */
function requireAdmin_(idToken) {
  var identity = verifyGoogleIdToken_(idToken);
  if (!isAdminEmail_(identity.email)) {
    throw new AppError_('UNAUTHORIZED', 'You are not authorized to access the admin dashboard.');
  }
  return identity.email;
}
