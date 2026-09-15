/**
 * device.js
 * Generates a coarse, privacy-conscious client device identifier and
 * returns only its SHA-256 hash — never raw device details — to the
 * backend, as an additional anti-abuse signal alongside the primary
 * "one verified email per voting day" rule.
 */

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getDeviceHash() {
  const stored = localStorage.getItem('lup_device_hash');
  if (stored) return stored;

  const signal = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || '',
    Math.random().toString(36).slice(2) // salt so it's not a stable cross-site fingerprint
  ].join('|');

  const hash = await sha256(signal);
  localStorage.setItem('lup_device_hash', hash);
  return hash;
}
