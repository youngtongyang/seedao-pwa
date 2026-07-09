import type { ProposalStatus, ProposalType, ProposalTypeGroup, VoteType } from "./types";

export type ProposalTypeMeta = {
  id: ProposalType;
  label: string;
  /** Short tag shown on list cards */
  tag: string;
  /** Backend `type` field (Chinese label) */
  wireType: string;
  resolutionRule: string;
  defaultPublicityHours: number;
  defaultVoteHours: number;
};

export const PROPOSAL_TYPE_GROUPS: ProposalTypeGroup[] = [
  {
    id: "node_consensus",
    types: ["node_consensus_rule", "node_consensus_special"],
  },
  {
    id: "town_hall",
    types: ["town_hall_meeting"],
  },
];

export const PROPOSAL_TYPES: Record<ProposalType, ProposalTypeMeta> = {
  node_consensus_rule: {
    id: "node_consensus_rule",
    label: "节点共识大会规则提案",
    tag: "节点共识大会规则提案",
    wireType: "节点共识大会规则提案",
    resolutionRule: "standard",
    defaultPublicityHours: 96,
    defaultVoteHours: 48,
  },
  node_consensus_special: {
    id: "node_consensus_special",
    label: "节点共识大会特别提案",
    tag: "节点共识大会特别提案",
    wireType: "节点共识大会特别提案",
    resolutionRule: "node_consensus_special",
    defaultPublicityHours: 96,
    defaultVoteHours: 48,
  },
  town_hall_meeting: {
    id: "town_hall_meeting",
    label: "市政厅联席会议常规提案",
    tag: "市政厅联席会议常规提案",
    wireType: "市政厅联席会议常规提案",
    resolutionRule: "town_hall_standard",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
  p1_project_init: {
    id: "p1_project_init",
    label: "P1 提案立项",
    tag: "P1提案立项",
    wireType: "P1提案立项",
    resolutionRule: "p1_standard",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
  p2_project_init: {
    id: "p2_project_init",
    label: "P2 提案立项",
    tag: "P2提案立项",
    wireType: "P2提案立项",
    resolutionRule: "p2_standard",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
  p2_project_close: {
    id: "p2_project_close",
    label: "P2 提案结项",
    tag: "P2提案结项",
    wireType: "P2提案结项",
    resolutionRule: "p2_standard",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
  p3_project_init: {
    id: "p3_project_init",
    label: "P3 提案立项",
    tag: "P3提案立项",
    wireType: "P3提案立项",
    resolutionRule: "p3_standard",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
  p3_project_close: {
    id: "p3_project_close",
    label: "P3 提案结项",
    tag: "P3提案结项",
    wireType: "P3提案结项",
    resolutionRule: "p3_standard",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
  p3_special: {
    id: "p3_special",
    label: "P3 特别提案",
    tag: "P3特别提案",
    wireType: "P3特别提案",
    resolutionRule: "p3_special",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
  town_hall_evaluation: {
    id: "town_hall_evaluation",
    label: "市政厅岗位评估",
    tag: "市政厅岗位评估",
    wireType: "市政厅岗位评估",
    resolutionRule: "town_hall_standard",
    defaultPublicityHours: 72,
    defaultVoteHours: 48,
  },
};

export type ProposalStatusMeta = {
  id: ProposalStatus;
  label: string;
  /** Tailwind badge classes */
  className: string;
};

export const PROPOSAL_STATUSES: Record<ProposalStatus, ProposalStatusMeta> = {
  pending_submit: {
    id: "pending_submit",
    label: "未提交",
    className: "bg-muted text-muted-foreground",
  },
  draft: {
    id: "draft",
    label: "草稿",
    className: "bg-muted text-muted-foreground",
  },
  publicity: {
    id: "publicity",
    label: "公示中",
    className: "bg-accent/15 text-accent-foreground",
  },
  voting: {
    id: "voting",
    label: "投票中",
    className: "bg-primary/15 text-primary",
  },
  vote_passed: {
    id: "vote_passed",
    label: "已通过",
    className: "bg-success text-success-foreground",
  },
  vote_failed: {
    id: "vote_failed",
    label: "未通过",
    className: "bg-destructive/15 text-destructive",
  },
  rejected: {
    id: "rejected",
    label: "已驳回",
    className: "bg-destructive/15 text-destructive",
  },
  withdrawn: {
    id: "withdrawn",
    label: "已撤回",
    className: "bg-muted text-muted-foreground",
  },
  pending_execution: {
    id: "pending_execution",
    label: "待执行",
    className: "bg-accent/15 text-accent-foreground",
  },
  execution_failed: {
    id: "execution_failed",
    label: "执行失败",
    className: "bg-destructive/15 text-destructive",
  },
  vetoed: {
    id: "vetoed",
    label: "被否决",
    className: "bg-destructive/15 text-destructive",
  },
};

export const VOTE_TYPES: Record<VoteType, { id: VoteType; label: string }> = {
  1: { id: 1, label: "单选投票" },
  2: { id: 2, label: "多选投票" },
};

/** Coerce API vote_type to 1 (single) or 2 (multi). */
export function normalizeVoteType(voteType: unknown): VoteType {
  const n = Number(voteType);
  return n === 2 ? 2 : 1;
}

export function voteTypeLabel(voteType: unknown): string {
  return VOTE_TYPES[normalizeVoteType(voteType)].label;
}

/** Ensure SNS displays as `name.seedao` (API may return short name only). Wallet fallbacks are unchanged. */
export function formatSnsName(name: string | null | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("0x")) return trimmed;
  if (lower.endsWith(".seedao")) return lower;
  return `${lower}.seedao`;
}

export function snsEquals(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return formatSnsName(a) === formatSnsName(b);
}

/** Map backend `type` (Chinese or legacy wire keys) to internal UI keys. */
const WIRE_TYPE_TO_ID: Record<string, ProposalType> = {
  节点共识大会规则提案: "node_consensus_rule",
  节点共识大会特别提案: "node_consensus_special",
  节点共识大会提案: "node_consensus_rule",
  市政厅联席会议常规提案: "town_hall_meeting",
  市政厅提案: "town_hall_meeting",
  P1提案立项: "p1_project_init",
  P2提案立项: "p2_project_init",
  P2提案结项: "p2_project_close",
  P3提案立项: "p3_project_init",
  P3提案结项: "p3_project_close",
  P3特别提案: "p3_special",
  市政厅岗位评估: "town_hall_evaluation",
  // Legacy wire / mock keys
  node_assembly: "node_consensus_rule",
  node_consensus: "node_consensus_rule",
  node_consensus_standard: "node_consensus_rule",
  node_consensus_special: "node_consensus_special",
  town_hall: "town_hall_meeting",
  municipal_hall: "town_hall_meeting",
  town_hall_standard: "town_hall_meeting",
};

export function normalizeProposalType(type: string): string {
  if (type in PROPOSAL_TYPES) return type;
  return WIRE_TYPE_TO_ID[type] ?? type;
}

/** Map internal type key to backend `type` for create/list filters. */
export function typeToWire(type: string): string {
  const id = normalizeProposalType(type);
  const meta = PROPOSAL_TYPES[id as ProposalType];
  return meta?.wireType ?? type;
}

export function statusLabel(status: string): string {
  const meta = PROPOSAL_STATUSES[status as ProposalStatus];
  return meta?.label ?? status;
}

export function typeLabel(type: string): string {
  const normalized = normalizeProposalType(type);
  const meta = PROPOSAL_TYPES[normalized as ProposalType];
  return meta?.label ?? type;
}

export function typeTag(type: string): string {
  const normalized = normalizeProposalType(type);
  const meta = PROPOSAL_TYPES[normalized as ProposalType];
  return meta?.tag ?? type;
}

/** Proposal types that expose voting rules in the UI. */
const VOTE_RULES_TYPES: ProposalType[] = [
  "node_consensus_rule",
  "node_consensus_special",
  "town_hall_meeting",
];

export function showsVoteRules(type: string): boolean {
  const id = normalizeProposalType(type) as ProposalType;
  return VOTE_RULES_TYPES.includes(id);
}

export function isHistoryStatus(status: string): boolean {
  return (
    status === "vote_passed" ||
    status === "vote_failed" ||
    status === "rejected" ||
    status === "withdrawn" ||
    status === "pending_execution" ||
    status === "execution_failed" ||
    status === "vetoed"
  );
}

/** Unsubmitted local/API draft — hide SIP prefix and show edit actions. */
export function isUnsubmittedDraft(status: string): boolean {
  return status === "draft" || status === "pending_submit";
}

/** Mirror backend isCommentableStatus — draft/closed proposals cannot receive comments. */
export function isCommentableStatus(status: string): boolean {
  return !isUnsubmittedDraft(status) && status !== "withdrawn";
}

/** Only fetch votes/me once voting may have started (skip draft & publicity). */
export function shouldFetchMyVote(status: string): boolean {
  return !isUnsubmittedDraft(status) && status !== "publicity";
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
