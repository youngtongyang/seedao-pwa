/**
 * Membership is the single gate for "logged in": only a paid member may reach the
 * profile or be treated as authenticated. The source of truth is the backend's
 * `membership_expires_at` (RFC3339, or null when never paid). Used on both the
 * server (cookie gating) and the client (post-auth routing), so it stays free of
 * `server-only` imports.
 */
export function isMembershipActive(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && t > Date.now();
}
