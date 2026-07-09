import type {
  CastVoteInput,
  CreateCommentInput,
  CreateProposalInput,
  ListProposalsQuery,
  ProposalCommentItem,
  ProposalDetail,
  ProposalListResult,
  ProposalResponse,
  ProposalVoteItem,
  PublishProposalInput,
  UpdateProposalInput,
  VoteTally,
} from "./types";

export type ApiOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string; message?: string };

function errorOf(data: Record<string, unknown>): string | undefined {
  return typeof data.error === "string" ? data.error : undefined;
}

function messageOf(data: Record<string, unknown>): string | undefined {
  return typeof data.message === "string" ? data.message : undefined;
}

async function parse<T>(res: Response): Promise<ApiOutcome<T>> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return { ok: false, error: errorOf(data), message: messageOf(data) };
  }
  return { ok: true, data: data as T };
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function fetchProposals(
  query: ListProposalsQuery = {},
): Promise<ApiOutcome<ProposalListResult>> {
  try {
    const res = await fetch(`/api/proposals${qs(query)}`, { cache: "no-store" });
    return parse<ProposalListResult>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function fetchProposal(
  id: number,
  opts?: { include_votes?: boolean; include_comments?: boolean },
): Promise<ApiOutcome<ProposalDetail>> {
  try {
    const res = await fetch(
      `/api/proposals/${id}${qs({
        include_votes: opts?.include_votes ? "true" : undefined,
        include_comments: opts?.include_comments ? "true" : undefined,
      })}`,
      { cache: "no-store" },
    );
    return parse<ProposalDetail>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function createProposal(
  input: CreateProposalInput,
): Promise<ApiOutcome<ProposalResponse>> {
  try {
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parse<ProposalResponse>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function updateProposal(
  id: number,
  input: UpdateProposalInput,
): Promise<ApiOutcome<ProposalResponse>> {
  try {
    const res = await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parse<ProposalResponse>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function publishProposal(
  id: number,
  input: PublishProposalInput = {},
): Promise<ApiOutcome<ProposalResponse>> {
  try {
    const res = await fetch(`/api/proposals/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parse<ProposalResponse>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function closeProposal(id: number): Promise<ApiOutcome<ProposalResponse>> {
  try {
    const res = await fetch(`/api/proposals/${id}/close`, { method: "POST" });
    return parse<ProposalResponse>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function finalizeProposal(id: number): Promise<ApiOutcome<ProposalDetail>> {
  try {
    const res = await fetch(`/api/proposals/${id}/finalize`, { method: "POST" });
    return parse<ProposalDetail>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function fetchVoteSummary(id: number): Promise<ApiOutcome<VoteTally>> {
  try {
    const res = await fetch(`/api/proposals/${id}/vote-summary`, { cache: "no-store" });
    return parse<VoteTally>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function fetchVotes(id: number): Promise<ApiOutcome<ProposalVoteItem[]>> {
  try {
    const res = await fetch(`/api/proposals/${id}/votes`, { cache: "no-store" });
    return parse<ProposalVoteItem[]>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function fetchMyVote(id: number): Promise<ApiOutcome<ProposalVoteItem | null>> {
  try {
    const res = await fetch(`/api/proposals/${id}/votes/me`, { cache: "no-store" });
    return parse<ProposalVoteItem | null>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function castVote(
  id: number,
  input: CastVoteInput,
): Promise<ApiOutcome<ProposalVoteItem>> {
  try {
    const res = await fetch(`/api/proposals/${id}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parse<ProposalVoteItem>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function fetchComments(id: number): Promise<ApiOutcome<ProposalCommentItem[]>> {
  try {
    const res = await fetch(`/api/proposals/${id}/comments`, { cache: "no-store" });
    return parse<ProposalCommentItem[]>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export async function createComment(
  id: number,
  input: CreateCommentInput,
): Promise<ApiOutcome<ProposalCommentItem>> {
  try {
    const res = await fetch(`/api/proposals/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parse<ProposalCommentItem>(res);
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}
