/**
 * Security.gs
 * Lightweight rate limiting and suspicious-activity detection using
 * CacheService (fast, ephemeral) backed by SuspiciousActivity logging
 * (durable, for admin review). The frontend's own throttling is never
 * relied upon.
 */

var CACHE = CacheService.getScriptCache();

/**
 * Increments a per-key counter with a 60 second window and throws if the
 * caller has exceeded the allowed request rate.
 */
function enforceRateLimit_(key, maxPerMinute) {
  var cacheKey = 'rl_' + key;
  var current = CACHE.get(cacheKey);
  var count = current ? parseInt(current, 10) : 0;
  if (count >= maxPerMinute) {
    throw new AppError_('RATE_LIMITED', 'Too many requests. Please slow down and try again shortly.');
  }
  CACHE.put(cacheKey, String(count + 1), 60);
}

/**
 * Tracks failed vote attempts per email hash; flags for review if a
 * threshold is exceeded within an hour, without blocking the user.
 */
function trackFailedVoteAttempt_(emailHash, deviceHash, reason) {
  var cacheKey = 'fail_' + emailHash;
  var current = CACHE.get(cacheKey);
  var count = current ? parseInt(current, 10) : 0;
  count += 1;
  CACHE.put(cacheKey, String(count), 3600);
  if (count === RATE_LIMIT.MAX_FAILED_VOTES_PER_HOUR) {
    logSuspicious_(emailHash, deviceHash, 'REPEATED_FAILED_VOTES', 'MEDIUM', { reason: reason, count: count });
  }
}

/**
 * Flags a device hash that is associated with an unusual number of
 * distinct voter emails in a short window — a signal, not a verdict.
 */
function checkDeviceFanout_(deviceHash, emailHash) {
  if (!deviceHash) return;
  var cacheKey = 'dev_' + deviceHash;
  var raw = CACHE.get(cacheKey);
  var emails = raw ? JSON.parse(raw) : [];
  if (emails.indexOf(emailHash) === -1) {
    emails.push(emailHash);
    if (emails.length > 25) emails = emails.slice(-25);
    CACHE.put(cacheKey, JSON.stringify(emails), 21600); // 6 hours
  }
  if (emails.length >= 6) {
    logSuspicious_(emailHash, deviceHash, 'DEVICE_MULTIPLE_VOTERS', 'LOW', { distinctVoters: emails.length });
  }
}
