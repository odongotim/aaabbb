/**
 * api.js
 * Thin client for the Supabase backend. Every call is a Postgres RPC
 * function; the backend is the sole authority on validation, so this
 * layer does no business logic of its own.
 *
 * Admin-facing calls were intentionally removed from this build — all
 * contestant management, settings, voting-window control, results
 * release, and voter/audit data is handled directly in the Supabase
 * dashboard (Table Editor / SQL Editor) instead of an in-app admin
 * panel. The underlying admin_* Postgres functions still exist in the
 * database; they're just not called from this frontend.
 *
 * The `idToken`-shaped first argument in the voting calls is unused —
 * Supabase attaches the signed-in voter's session to every RPC call
 * automatically. It's kept only so call sites read the same way they
 * always have.
 */
import { supabase, supabaseConfigured } from '../lib/supabaseClient.js';

class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Postgres functions raise errors as "CODE: human message" so the client
// can recover a { code, message } shape instead of a raw DB error.
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
  getPublicDailyResults: () => rpc('get_public_daily_results'),

  submitVote: (_idToken, contestantId, deviceHash) =>
    rpc('submit_vote', { p_contestant_id: contestantId, p_device_hash: deviceHash || '' }),
  submitVotes: (_idToken, { femaleContestantId, maleContestantId }, deviceHash) =>
    rpc('submit_votes', {
      p_female_contestant_id: femaleContestantId || null,
      p_male_contestant_id: maleContestantId || null,
      p_device_hash: deviceHash || ''
    }),
  checkVoterStatus: (_idToken, category) => rpc('check_voter_status', { p_category: category || null })
};

export { ApiError };
