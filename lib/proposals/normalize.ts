import {
  encodeProposalContent,
  encodeVoteOptions,
  parseWireContent,
  parseWireVoteOptions,
} from "./codec";
import { formatSnsName, normalizeProposalType, normalizeVoteType, typeToApi } from "./constants";
import type {
  ProposalCommentItem,
  ProposalContent,
  ProposalDetail,
  ProposalListItem,
  ProposalStatus,
  ProposalVoteItem,
} from "./types";

/**
 * Map API `status` values to internal UI keys.
 * Go API: draft = 未发布草稿, publicity = 公示中.
 */
const STATUS_ALIASES: Record<string, ProposalStatus> = {
  pending_submit: "pending_submit",
  draft: "draft",
  publicity: "publicity",
  publicizing: "publicity",
  publicized: "publicity",
  published: "voting",
  withdrawn: "withdrawn",
  approved: "vote_passed",
  rejected: "rejected",
  voting: "voting",
  vote_passed: "vote_passed",
  vote_failed: "vote_failed",
  pending_execution: "pending_execution",
  executed: "vote_passed",
  execution_failed: "execution_failed",
  vetoed: "vetoed",
  passed: "vote_passed",
  failed: "vote_failed",
  closed: "withdrawn",
};

/** Map internal UI status keys back to API query values. */
const STATUS_TO_WIRE: Partial<Record<ProposalStatus, string>> = {
  publicity: "publicity",
  draft: "draft",
};

export function normalizeStatus(status: string): ProposalStatus {
  return STATUS_ALIASES[status] ?? (status as ProposalStatus);
}

export function statusToWire(status: string): string | undefined {
  if (!status) return undefined;
  return STATUS_TO_WIRE[status as ProposalStatus] ?? status;
}

export function normalizeListItem(item: ProposalListItem): ProposalListItem {
  return {
    ...item,
    title: item.title ?? "",
    proposer_sns: formatSnsName(item.proposer_sns),
    type: normalizeProposalType(item.type),
    status: normalizeStatus(item.status),
  };
}

export function normalizeVoteItem(v: ProposalVoteItem): ProposalVoteItem {
  return { ...v, sns_name: formatSnsName(v.sns_name) };
}

type RawCommentItem = ProposalCommentItem & { replies?: RawCommentItem[] };

export function normalizeCommentItem(c: RawCommentItem): ProposalCommentItem {
  return {
    ...c,
    sns_name: formatSnsName(c.sns_name),
    replies: c.replies?.map(normalizeCommentItem),
  };
}

type RawProposalDetail = Omit<ProposalDetail, "content" | "vote_options"> & {
  content?: unknown;
  vote_options?: unknown;
};

/** Normalize detail: status, blocks content, vote option objects. */
export function normalizeDetail(raw: RawProposalDetail): ProposalDetail {
  const parsedContent: ProposalContent = parseWireContent(raw.content);
  const voteLabels = parseWireVoteOptions(raw.vote_options);
  const voteType = normalizeVoteType(raw.vote_type ?? parsedContent.vote_type);

  return {
    ...raw,
    title: raw.title ?? "",
    proposer_sns: formatSnsName(raw.proposer_sns),
    type: normalizeProposalType(raw.type),
    status: normalizeStatus(raw.status),
    vote_type: voteType,
    content: encodeProposalContent(parsedContent),
    vote_options: voteLabels.length > 0 ? encodeVoteOptions(voteLabels) : undefined,
    votes: raw.votes?.map(normalizeVoteItem),
    comments: raw.comments?.map(normalizeCommentItem),
  };
}

/** Strip client-only fields before POST /v1/proposals. */
export function toWireCreateBody(input: {
  title: string;
  type: string;
  resolution_rule: string;
  vote_type: number;
  content: number[];
  vote_options: number[];
}): {
  title: string;
  type: string;
  resolution_rule: string;
  vote_type: number;
  content: number[];
  vote_options: number[];
} {
  return {
    title: input.title.trim(),
    type: typeToApi(input.type),
    resolution_rule: input.resolution_rule,
    vote_type: input.vote_type,
    content: input.content,
    vote_options: input.vote_options,
  };
}

/** Strip to swagger PATCH fields. */
export function toWireUpdateBody(input: {
  title?: string;
  content?: number[];
  vote_options?: number[];
  vote_type?: number;
}): {
  title?: string;
  content?: number[];
  vote_options?: number[];
  vote_type?: number;
} {
  const body: {
    title?: string;
    content?: number[];
    vote_options?: number[];
    vote_type?: number;
  } = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.content !== undefined) body.content = input.content;
  if (input.vote_options !== undefined) body.vote_options = input.vote_options;
  if (input.vote_type !== undefined) body.vote_type = input.vote_type;
  return body;
}
