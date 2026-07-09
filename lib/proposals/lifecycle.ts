import { decodeVoteOptions } from "./codec";
import type { ProposalDetail, ProposalStatus } from "./types";

export type ProposalHistoryKind =
  | "created"
  | "published"
  | "voting_started"
  | "voting_ended"
  | "passed"
  | "failed"
  | "withdrawn";

export type ProposalHistoryEvent = {
  id: string;
  kind: ProposalHistoryKind;
  at: string;
  label: string;
  detail?: string;
};

export type HistoryLabels = Record<ProposalHistoryKind, string>;

function parseTime(iso: string | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Remaining ms until an ISO timestamp; negative means elapsed. */
export function msUntil(iso: string | undefined, now = Date.now()): number | null {
  const t = parseTime(iso);
  return t === null ? null : t - now;
}

/** Human-readable countdown for publicity/voting banners. */
export function formatCountdown(ms: number, locale: "zh" | "en" = "zh"): string {
  if (ms <= 0) return locale === "zh" ? "0秒" : "0s";

  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (locale === "zh") {
    if (days > 0) {
      const parts = [`${days}天`];
      if (hours > 0) parts.push(`${hours}小时`);
      if (minutes > 0) parts.push(`${minutes}分`);
      return parts.join(" ");
    }
    if (hours > 0) return `${hours}小时 ${pad(minutes)}分 ${pad(seconds)}秒`;
    if (minutes > 0) return `${minutes}分 ${pad(seconds)}秒`;
    return `${seconds}秒`;
  }

  if (days > 0) {
    const parts = [`${days}d`];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  }
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

/** Mock-side status sync: publicity → voting → finalized. */
export function syncProposalLifecycle(p: ProposalDetail, now = Date.now()): ProposalDetail {
  if (p.status === "withdrawn" || p.status === "vote_passed" || p.status === "vote_failed" || p.status === "rejected") {
    return p;
  }

  const pubEnd = parseTime(p.publicity_end_at);
  const voteEnd = parseTime(p.vote_end_at);

  if (p.status === "publicity" && pubEnd !== null && now >= pubEnd) {
    p.status = "voting";
    if (!p.vote_summary) {
      const options = decodeVoteOptions(p.vote_options);
      p.vote_summary = {
        total_votes: 0,
        valid_votes: 0,
        approve_count: 0,
        reject_count: 0,
        abstain_count: 0,
        approve_rate: 0,
        participation_rate: 0,
        by_result: Object.fromEntries(options.map((o) => [o, 0])),
        passed: false,
        resolved: false,
        resolution_rule: p.resolution_rule ?? "",
      };
    }
  }

  if (p.status === "voting" && voteEnd !== null && now >= voteEnd) {
    finalizeProposalTally(p);
  }

  return p;
}

/** Apply meta-rule tally and set terminal status on a proposal. */
export function finalizeProposalTally(p: ProposalDetail): ProposalDetail {
  if (p.status !== "voting") return p;

  const summary = p.vote_summary ?? {
    total_votes: p.votes?.length ?? 0,
    valid_votes: p.votes?.length ?? 0,
    approve_count: 0,
    reject_count: 0,
    abstain_count: 0,
    approve_rate: 0,
    participation_rate: 0,
    by_result: {},
    passed: false,
    resolved: false,
    resolution_rule: p.resolution_rule ?? "",
  };

  const entries = Object.entries(summary.by_result);
  const max = entries.reduce((m, [, c]) => Math.max(m, c), 0);
  const winners = entries.filter(([, c]) => c === max && max > 0).map(([k]) => k);

  summary.resolved = true;
  p.vote_summary = summary;
  p.updated_at = new Date().toISOString();

  if (max === 0 || winners.length > 1) {
    p.status = "vote_failed";
    summary.passed = false;
    summary.resolution_reason =
      winners.length > 1 ? "最高票选项并列，投票无效" : "未产生有效投票";
  } else {
    p.status = "vote_passed";
    summary.passed = true;
    summary.resolution_reason = `投票结束，选项"${winners[0]}"胜出`;
  }

  return p;
}

export function buildProposalHistory(
  p: ProposalDetail,
  labels: HistoryLabels,
): ProposalHistoryEvent[] {
  const events: ProposalHistoryEvent[] = [];

  if (p.created_at) {
    events.push({
      id: "created",
      kind: "created",
      at: p.created_at,
      label: labels.created,
      detail: p.proposer_sns,
    });
  }

  if (p.published_at) {
    events.push({
      id: "published",
      kind: "published",
      at: p.published_at,
      label: labels.published,
    });
  }

  const votingStartedAt =
    p.status !== "draft" && p.status !== "publicity" && p.publicity_end_at
      ? p.publicity_end_at
      : undefined;

  if (votingStartedAt && p.status !== "draft" && p.status !== "publicity") {
    events.push({
      id: "voting_started",
      kind: "voting_started",
      at: votingStartedAt,
      label: labels.voting_started,
    });
  }

  if (
    p.vote_end_at &&
    (p.status === "vote_passed" || p.status === "vote_failed" || p.vote_summary?.resolved)
  ) {
    events.push({
      id: "voting_ended",
      kind: "voting_ended",
      at: p.vote_end_at,
      label: labels.voting_ended,
    });
  }

  if (p.status === "withdrawn") {
    events.push({
      id: "withdrawn",
      kind: "withdrawn",
      at: p.updated_at ?? p.created_at,
      label: labels.withdrawn,
    });
  } else if (p.status === "vote_passed") {
    events.push({
      id: "passed",
      kind: "passed",
      at: p.updated_at ?? p.vote_end_at ?? p.created_at,
      label: labels.passed,
      detail: p.vote_summary?.resolution_reason,
    });
  } else if (p.status === "vote_failed") {
    events.push({
      id: "failed",
      kind: "failed",
      at: p.updated_at ?? p.vote_end_at ?? p.created_at,
      label: labels.failed,
      detail: p.vote_summary?.resolution_reason,
    });
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function canWithdraw(status: string): boolean {
  return status === "draft" || status === "pending_submit";
}

export function activePhase(
  status: ProposalStatus,
): "publicity" | "voting" | null {
  if (status === "publicity") return "publicity";
  if (status === "voting") return "voting";
  return null;
}
