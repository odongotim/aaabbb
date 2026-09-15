/**
 * Code.gs
 * Web app entry points. Only explicitly defined operations are exposed —
 * there is no generic "?sheet=X&action=Y" passthrough to the spreadsheet.
 *
 * The React frontend calls this web app with POST requests:
 *   { action: "getPublicSettings", payload: {...} }
 * and reads the JSON response: { success, data } or { success:false, error }.
 *
 * GET is supported only for simple, cacheable public reads (see doGet).
 */

var ALLOWED_ACTIONS = {
  // Public reads
  getPublicSettings: function (p) { return getPublicSettings_(); },
  getActiveContestants: function (p) { return getActiveContestants_(); },
  getPublicBootstrap: function (p) { return getPublicBootstrap_(); },
  getContestantDetails: function (p) { return getContestantDetails_(p.contestantId); },
  getPublicFinalResults: function (p) { return getPublicFinalResults_(); },

  // Voting (requires Google ID token)
  submitVote: function (p) { return submitVote_(p); },
  submitVotes: function (p) { return submitVotes_(p); },
  checkVoterStatus: function (p) { return checkVoterStatus_(p.idToken, p.category); },

  // Admin — overview & control
  adminOverview: function (p) { return adminOverview_(p.idToken); },
  adminUpdateVotingControl: function (p) { return adminUpdateVotingControl_(p.idToken, p); },
  adminUpdateSettings: function (p) { return adminUpdateSettings_(p.idToken, p.settings); },

  // Admin — contestants
  adminListContestants: function (p) { return adminListContestants_(p.idToken); },
  adminSaveContestant: function (p) { return adminSaveContestant_(p.idToken, p); },
  adminDisableContestant: function (p) { return adminDisableContestant_(p.idToken, p.contestantId); },

  // Admin — results
  adminVotingDaysList: function (p) { return adminVotingDaysList_(p.idToken); },
  adminDailyResults: function (p) { return adminDailyResults_(p.idToken, p.votingDay); },
  adminReleaseFinalResults: function (p) { return adminReleaseFinalResults_(p.idToken); },
  adminExportVotes: function (p) { return adminExportVotes_(p.idToken); },

  // Admin — voters & security
  adminListVoters: function (p) { return adminListVoters_(p.idToken, p.filters); },
  adminSuspiciousActivity: function (p) { return adminSuspiciousActivity_(p.idToken); },
  adminReviewSuspicious: function (p) { return adminReviewSuspicious_(p.idToken, p.timestamp, p.emailHash, p.newStatus); },
  adminAuditLogs: function (p) { return adminAuditLogs_(p.idToken); },

  // Admin — session check (used by the dashboard on load)
  adminWhoAmI: function (p) { var email = requireAdmin_(p.idToken); return { email: email }; }
};

function doPost(e) {
  return safeHandle_(function () {
    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      throw new AppError_('INVALID_REQUEST', 'Invalid request.');
    }
    var action = body.action;
    var payload = body.payload || {};

    if (!action || !ALLOWED_ACTIONS.hasOwnProperty(action)) {
      throw new AppError_('UNKNOWN_ACTION', 'Invalid request.');
    }

    // Basic per-IP-independent throttling by action+client hint, in
    // addition to the per-email limits enforced inside submitVote_.
    enforceRateLimit_('action_' + action + '_' + (payload.deviceHash || 'anon'), 30);

    return ALLOWED_ACTIONS[action](payload);
  });
}

/**
 * GET is limited to a small set of public, side-effect-free reads so the
 * platform still works if a client cannot issue a POST (e.g. simple link
 * previews). All state-changing and authenticated operations require POST.
 */
function doGet(e) {
  var action = e.parameter.action;
  var readOnlyGet = {
    getPublicSettings: function () { return getPublicSettings_(); },
    getActiveContestants: function () { return getActiveContestants_(); },
    getPublicBootstrap: function () { return getPublicBootstrap_(); },
    getPublicFinalResults: function () { return getPublicFinalResults_(); }
  };
  if (!action || !readOnlyGet.hasOwnProperty(action)) {
    return jsonResponse_({ success: false, error: { code: 'UNKNOWN_ACTION', message: 'Invalid request.' } });
  }
  return safeHandle_(readOnlyGet[action]);
}
