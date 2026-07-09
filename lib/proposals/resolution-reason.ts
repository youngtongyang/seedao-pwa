import type { Messages } from "@/lib/i18n/messages";

type ResolutionCopy = Messages["proposals"]["resolutionReasons"];

const REASON_KEYS: Record<string, keyof ResolutionCopy> = {
  "participation must exceed half of quarter nodes": "participationBelowHalfNodes",
  "quarter_node_total not configured": "quarterNodeTotalNotConfigured",
  "highest vote tie": "highestVoteTie",
  "no valid votes": "noValidVotes",
  "participation below quorum": "participationBelowQuorum",
  "participation below required rate": "participationBelowRate",
  "approval below half": "approvalBelowHalf",
  "approval below two thirds": "approvalBelowTwoThirds",
  "approval below 2/3": "approvalBelowTwoThirds",
  "voter not whitelisted": "voterNotWhitelisted",
  "not in voter whitelist": "voterNotWhitelisted",
};

const REASON_PATTERNS: Array<{ pattern: RegExp; key: keyof ResolutionCopy }> = [
  { pattern: /participation must exceed half of quarter nodes/i, key: "participationBelowHalfNodes" },
  { pattern: /quarter_node_total not configured/i, key: "quarterNodeTotalNotConfigured" },
  { pattern: /participation.*below|below.*quorum/i, key: "participationBelowGeneric" },
  { pattern: /approval.*below.*half|below.*1\/2|1\/2.*not/i, key: "approvalBelowHalf" },
  { pattern: /approval.*below.*two.?thirds|below.*2\/3|2\/3.*not/i, key: "approvalBelowTwoThirds" },
  { pattern: /whitelist|not.*eligible.*vot/i, key: "voterNotWhitelisted" },
  { pattern: /tie|tied|并列/i, key: "highestVoteTie" },
];

/** Format vote_summary.resolution_reason for UI. */
export function formatResolutionReason(
  reason: string | undefined | null,
  copy: ResolutionCopy,
): string {
  if (!reason) return "";
  const trimmed = reason.trim();
  if (!trimmed) return "";

  const aliasKey = REASON_KEYS[trimmed.toLowerCase()];
  if (aliasKey) return copy[aliasKey];

  for (const { pattern, key } of REASON_PATTERNS) {
    if (pattern.test(trimmed)) return copy[key];
  }

  if (/[\u4e00-\u9fff]/.test(trimmed)) return trimmed;

  return trimmed;
}
