import type { ApplicationStatus, MembershipTier } from "@/lib/api/types";

/**
 * Membership is the single gate for "logged in": only a paid member may reach the
 * profile or be treated as authenticated. The source of truth is the backend's
 * `membership_expires_at` (RFC3339, or null when never paid). Used on both the
 * server (cookie gating) and the client (post-auth routing), so it stays free of
 * `server-only` imports.
 *
 * Associate (`pending`) and full members both have an expiry after payment —
 * tier is for display / discounts, not this gate.
 */
export function isMembershipActive(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && t > Date.now();
}

export type MembershipDisplayKind =
  | "none"
  | "associate"
  | "under_review"
  | "full";

/** Map tier + application status to profile UI states. */
export function getMembershipDisplayKind(
  tier?: string | null,
  applicationStatus?: string | null,
): MembershipDisplayKind {
  const t = (tier ?? "none").toLowerCase();
  const a = (applicationStatus ?? "not_submitted").toLowerCase();
  if (t === "full") return "full";
  if (t === "pending") {
    if (a === "under_review") return "under_review";
    return "associate";
  }
  return "none";
}

/** Course / catalog member discounts apply only to full members. */
export function qualifiesForMemberDiscount(tier?: string | null): boolean {
  return (tier ?? "").toLowerCase() === "full";
}

export function parseMembershipTier(value: unknown): MembershipTier | undefined {
  if (value === "none" || value === "pending" || value === "full") return value;
  return undefined;
}

export function parseApplicationStatus(value: unknown): ApplicationStatus | undefined {
  if (value === "not_submitted" || value === "under_review" || value === "approved") {
    return value;
  }
  return undefined;
}

/** Convert fen (cents) to a display yuan number (e.g. 29900 → 299, 3500 → 35). */
export function fenToYuanAmount(fen: number): number {
  if (!Number.isFinite(fen)) return 0;
  return Math.round(fen) / 100;
}

/** `GET /v1/membership/fee` — annual list price; `amount` is integer 分. */
export type MembershipFee = {
  amount: number;
  currency: string;
  days: number;
};
