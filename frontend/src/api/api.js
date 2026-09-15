/**
 * api.js
 * Thin client for the Google Apps Script backend. Every call is a POST
 * with a JSON body { action, payload }; the backend is the sole authority
 * on validation, so this layer does no business logic of its own.
 *
 * Content-Type is deliberately "text/plain" rather than "application/json"
 * — Apps Script web apps do not support CORS preflight (OPTIONS), so a
 * "simple request" content type avoids the browser sending a preflight
 * that Apps Script cannot answer.
 */

const API_URL = import.meta.env.VITE_API_URL;

class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function call(action, payload = {}) {
  if (!API_URL || API_URL.includes('YOUR_DEPLOYMENT_ID')) {
    throw new ApiError('NOT_CONFIGURED', 'The voting platform is not yet connected to its backend. Please contact the site administrator.');
  }

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload })
    });
  } catch (e) {
    throw new ApiError('NETWORK_ERROR', 'Network error. Please check your connection and try again.');
  }

  let json;
  try {
    json = await response.json();
  } catch (e) {
    throw new ApiError('INTERNAL_ERROR', 'System temporarily unavailable. Please try again shortly.');
  }

  if (!json.success) {
    throw new ApiError(json.error?.code || 'UNKNOWN', json.error?.message || 'Something went wrong.');
  }
  return json.data;
}

export const api = {
  getPublicSettings: () => call('getPublicSettings'),
  getActiveContestants: () => call('getActiveContestants'),
  getContestantDetails: (contestantId) => call('getContestantDetails', { contestantId }),
  getPublicFinalResults: () => call('getPublicFinalResults'),

  submitVote: (idToken, contestantId, deviceHash) =>
    call('submitVote', { idToken, contestantId, deviceHash }),
  checkVoterStatus: (idToken) => call('checkVoterStatus', { idToken }),

  adminWhoAmI: (idToken) => call('adminWhoAmI', { idToken }),
  adminOverview: (idToken) => call('adminOverview', { idToken }),
  adminUpdateVotingControl: (idToken, data) => call('adminUpdateVotingControl', { idToken, ...data }),
  adminUpdateSettings: (idToken, settings) => call('adminUpdateSettings', { idToken, settings }),

  adminListContestants: (idToken) => call('adminListContestants', { idToken }),
  adminSaveContestant: (idToken, data) => call('adminSaveContestant', { idToken, ...data }),
  adminDisableContestant: (idToken, contestantId) => call('adminDisableContestant', { idToken, contestantId }),

  adminVotingDaysList: (idToken) => call('adminVotingDaysList', { idToken }),
  adminDailyResults: (idToken, votingDay) => call('adminDailyResults', { idToken, votingDay }),
  adminReleaseFinalResults: (idToken) => call('adminReleaseFinalResults', { idToken }),
  adminExportVotes: (idToken) => call('adminExportVotes', { idToken }),

  adminListVoters: (idToken, filters) => call('adminListVoters', { idToken, filters }),
  adminSuspiciousActivity: (idToken) => call('adminSuspiciousActivity', { idToken }),
  adminReviewSuspicious: (idToken, timestamp, emailHash, newStatus) =>
    call('adminReviewSuspicious', { idToken, timestamp, emailHash, newStatus }),
  adminAuditLogs: (idToken) => call('adminAuditLogs', { idToken })
};

export { ApiError };
