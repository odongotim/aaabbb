/**
 * api.js
 * Thin client for the Supabase backend. Every call is a Postgres RPC
 * function (see supabase/migrations/0001_init.sql); the backend is the
 * sole authority on validation, so this layer does no business logic
 * of its own.
 *
 * Function signatures intentionally keep an unused `idToken`-shaped first
 * argument in the voting/admin calls, matching the previous Apps Script
 * client — Supabase attaches the signed-in user's session to every RPC
 * call automatically, so the page components that call these functions
 * did not need to change.
 */
import { supabase, supabaseConfigured } from '../lib/supabaseClient.js';

class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Postgres functions raise errors as "CODE: human message" so the client
// can recover the same { code, message } shape the old Apps Script JSON
// error envelope provided.
function toApiError(error) {
  const raw = (error && error.message) || 'Something went wrong.';
  const match = raw.match(/^([A-Z_]+):\s*(.*)$/s);
  if (match) return new ApiError(match[1], match[2]);
  if (/fetch|network/i.test(raw)) {
    return new ApiError('NETWORK_ERROR', 'Network error. Please check your connection and try again.');
  }
  return new ApiError('INTERNAL_ERROR', 'System temporarily unavailable. Please try again shortly.');
}

async function rpc(fn, params = {}) {
  if (!supabaseConfigured) {
    throw new ApiError('NOT_CONFIGURED', 'The voting platform is not yet connected to its backend. Please contact the site administrator.');
  }
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw toApiError(error);
  return data;
}

export const api = {
  getPublicSettings: () => rpc('get_public_settings'),
  getActiveContestants: () => rpc('get_active_contestants'),
  getContestantDetails: (contestantId) => rpc('get_contestant_details', { p_contestant_id: contestantId }),
  getPublicFinalResults: () => rpc('get_public_final_results'),

  submitVote: (_idToken, contestantId, deviceHash) =>
    rpc('submit_vote', { p_contestant_id: contestantId, p_device_hash: deviceHash || '' }),
  submitVotes: (_idToken, { femaleContestantId, maleContestantId }, deviceHash) =>
    rpc('submit_votes', {
      p_female_contestant_id: femaleContestantId || null,
      p_male_contestant_id: maleContestantId || null,
      p_device_hash: deviceHash || ''
    }),
  checkVoterStatus: (_idToken, category) => rpc('check_voter_status', { p_category: category || null }),

  adminWhoAmI: () => rpc('admin_who_am_i'),
  adminOverview: () => rpc('admin_overview'),
  adminUpdateVotingControl: (_idToken, data) =>
    rpc('admin_update_voting_control', {
      p_start_datetime: data.startDatetime,
      p_end_datetime: data.endDatetime,
      p_timezone: data.timezone
    }),
  adminUpdateSettings: (_idToken, settings) => rpc('admin_update_settings', { p_settings: settings }),

  adminListContestants: () => rpc('admin_list_contestants'),
  adminSaveContestant: (_idToken, data) =>
    rpc('admin_save_contestant', {
      p_contestant_id: data.contestantId || null,
      p_contestant_number: data.contestantNumber,
      p_name: data.name,
      p_category: data.category,
      p_biography: data.biography,
      p_photo_url: data.photoUrl,
      p_status: data.status || null
    }),
  adminDisableContestant: (_idToken, contestantId) => rpc('admin_disable_contestant', { p_contestant_id: contestantId }),

  adminVotingDaysList: () => rpc('admin_voting_days_list'),
  adminDailyResults: (_idToken, votingDay) => rpc('admin_daily_results', { p_voting_day: votingDay }),
  adminReleaseFinalResults: () => rpc('admin_release_final_results'),
  adminExportVotes: () => rpc('admin_export_votes'),

  adminListVoters: (_idToken, filters) => rpc('admin_list_voters', { p_filters: filters || {} }),
  adminSuspiciousActivity: () => rpc('admin_suspicious_activity'),
  adminReviewSuspicious: (_idToken, timestamp, emailHash, newStatus) =>
    rpc('admin_review_suspicious', { p_timestamp: timestamp, p_email_hash: emailHash, p_new_status: newStatus }),
  adminAuditLogs: () => rpc('admin_audit_logs')
};

export { ApiError };
