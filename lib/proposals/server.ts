import "server-only";

import { type ApiResult, call } from "@/lib/api/server";
import { USE_MOCK } from "@/lib/api/config";
import { ErrCode } from "@/lib/api/types";
import { encodeProposalContent, encodeVoteOptions } from "./codec";
import { finalizeProposalTally, syncProposalLifecycle } from "./lifecycle";
import {
  normalizeCommentItem,
  normalizeDetail,
  normalizeListItem,
  normalizeVoteItem,
  statusToWire,
  toWireCreateBody,
  toWireUpdateBody,
} from "./normalize";
import { typeToWire } from "./constants";
import type {
  CastVoteInput,
  CreateCommentInput,
  CreateProposalInput,
  ListProposalsQuery,
  ProposalCommentItem,
  ProposalDetail,
  ProposalListItem,
  ProposalListResult,
  ProposalResponse,
  ProposalVoteItem,
  PublishProposalInput,
  UpdateProposalInput,
  VoteTally,
} from "./types";

function normalizeSipQuery(sip?: string): string | undefined {
  const raw = sip?.replace(/^sip-/i, "").trim();
  return raw || undefined;
}

function normalizeKeyword(keyword?: string): string | undefined {
  const raw = keyword?.trim();
  return raw || undefined;
}

function queryString(q: ListProposalsQuery): Record<string, string | undefined> {
  return {
    limit: q.limit !== undefined ? String(q.limit) : undefined,
    before_id: q.before_id !== undefined ? String(q.before_id) : undefined,
    type: q.type ? typeToWire(q.type) : undefined,
    status: q.status ? statusToWire(q.status) : undefined,
    sip: normalizeSipQuery(q.sip),
    keyword: normalizeKeyword(q.keyword),
  };
}

function matchesKeyword(item: ProposalListItem, keyword: string): boolean {
  const q = keyword.toLowerCase();
  return (
    (item.title?.toLowerCase() ?? "").includes(q) ||
    (item.proposer_sns?.toLowerCase() ?? "").includes(q) ||
    sipOfItem(item).includes(q)
  );
}

async function searchProposalsByKeyword(
  q: ListProposalsQuery,
  keyword: string,
): Promise<ApiResult<ProposalListResult>> {
  const limit = q.limit ?? 20;
  const pageSize = 50;
  let scanBefore = q.before_id;
  const matches: ProposalListItem[] = [];

  for (let page = 0; page < 40 && matches.length < limit; page++) {
    const result = await call<ProposalListResult>("/proposals", {
      query: queryString({
        ...q,
        keyword,
        sip: undefined,
        limit: pageSize,
        before_id: scanBefore,
      }),
    });
    if (!result.ok) return result;

    for (const item of result.data.items) {
      if (matchesKeyword(item, keyword)) {
        matches.push(normalizeListItem(item));
        if (matches.length >= limit) break;
      }
    }

    if (matches.length >= limit || !result.data.next_before) break;
    scanBefore = result.data.next_before;
  }

  return { ok: true, data: { items: matches, next_before: undefined } };
}

function sipOfItem(item: ProposalListItem): string {
  if (item.sip) return String(item.sip);
  const m = item.title.match(/SIP-(\d+)/i);
  return m?.[1] ?? "";
}

async function findProposalsBySip(
  q: ListProposalsQuery,
  sip: string,
): Promise<ApiResult<ProposalListResult>> {
  let before_id = q.before_id;
  const pageSize = 50;

  for (let page = 0; page < 40; page++) {
    const result = await call<ProposalListResult>("/proposals", {
      query: queryString({ ...q, sip, limit: pageSize, before_id }),
    });
    if (!result.ok) return result;

    const match = result.data.items.find((item) => sipOfItem(item) === sip);
    if (match) {
      return {
        ok: true,
        data: { items: [normalizeListItem(match)], next_before: undefined },
      };
    }

    if (!result.data.next_before) break;
    before_id = result.data.next_before;
  }

  return { ok: true, data: { items: [], next_before: undefined } };
}

export async function listProposals(
  q: ListProposalsQuery = {},
): Promise<ApiResult<ProposalListResult>> {
  if (USE_MOCK) return mock.listProposals(q);

  const sip = normalizeSipQuery(q.sip);
  if (sip) return findProposalsBySip({ ...q, sip: undefined }, sip);

  const keyword = normalizeKeyword(q.keyword);
  if (keyword) return searchProposalsByKeyword({ ...q, keyword: undefined }, keyword);

  return call<ProposalListResult>("/proposals", { query: queryString(q) }).then((r) => {
    if (!r.ok) return r;
    return {
      ok: true,
      data: {
        ...r.data,
        items: r.data.items.map(normalizeListItem),
      },
    };
  });
}

export function getProposal(
  id: number,
  opts?: { include_votes?: boolean; include_comments?: boolean },
): Promise<ApiResult<ProposalDetail>> {
  if (USE_MOCK) return mock.getProposal(id, opts);
  return call<ProposalDetail>(`/proposals/${id}`, {
    query: {
      include_votes: opts?.include_votes ? "true" : undefined,
      include_comments: opts?.include_comments ? "true" : undefined,
    },
  }).then((r) => (r.ok ? { ok: true, data: normalizeDetail(r.data) } : r));
}

/** POST /v1/proposals/:id/finalize — 投票结束后结票 */
export function finalizeProposal(
  id: number,
  token: string,
): Promise<ApiResult<ProposalDetail>> {
  if (USE_MOCK) return mock.finalizeProposal(id);
  return call<ProposalDetail>(`/proposals/${id}/finalize`, { method: "POST", token }).then((r) =>
    r.ok ? { ok: true, data: normalizeDetail(r.data) } : r,
  );
}

/** Fetch detail and attempt lifecycle sync (mock local / real via finalize). */
export async function getProposalSynced(
  id: number,
  opts?: { include_votes?: boolean; include_comments?: boolean },
  token?: string,
): Promise<ApiResult<ProposalDetail>> {
  if (USE_MOCK) return mock.getProposal(id, opts);

  let result = await getProposal(id, opts);
  if (!result.ok) return result;

  const p = result.data;
  const voteEnd = p.vote_end_at ? new Date(p.vote_end_at).getTime() : null;
  if (p.status === "voting" && voteEnd !== null && Date.now() >= voteEnd && token) {
    const fin = await finalizeProposal(id, token);
    if (fin.ok) result = await getProposal(id, opts);
  }
  return result;
}

export function createProposal(
  input: CreateProposalInput,
  token: string,
): Promise<ApiResult<ProposalResponse>> {
  if (USE_MOCK) return mock.createProposal(input);
  return call<ProposalResponse>("/proposals", {
    method: "POST",
    token,
    body: toWireCreateBody(input),
  }).then((r) => (r.ok ? { ok: true, data: normalizeDetail(r.data) } : r));
}

export function updateProposal(
  id: number,
  input: UpdateProposalInput,
  token: string,
): Promise<ApiResult<ProposalResponse>> {
  if (USE_MOCK) return mock.updateProposal(id, input);
  return call<ProposalResponse>(`/proposals/${id}`, {
    method: "PATCH",
    token,
    body: toWireUpdateBody(input),
  }).then((r) => (r.ok ? { ok: true, data: normalizeDetail(r.data) } : r));
}

export function publishProposal(
  id: number,
  input: PublishProposalInput,
  token: string,
): Promise<ApiResult<ProposalResponse>> {
  if (USE_MOCK) return mock.publishProposal(id, input);
  return call<ProposalResponse>(`/proposals/${id}/publish`, {
    method: "POST",
    token,
    body: input,
  }).then((r) => (r.ok ? { ok: true, data: normalizeDetail(r.data) } : r));
}

export function closeProposal(id: number, token: string): Promise<ApiResult<ProposalResponse>> {
  if (USE_MOCK) return mock.closeProposal(id);
  return call<ProposalResponse>(`/proposals/${id}/close`, { method: "POST", token }).then((r) =>
    r.ok ? { ok: true, data: normalizeDetail(r.data) } : r,
  );
}

export function getVoteSummary(id: number): Promise<ApiResult<VoteTally>> {
  if (USE_MOCK) return mock.getVoteSummary(id);
  return call<VoteTally>(`/proposals/${id}/vote-summary`);
}

export function listVotes(
  id: number,
  limit?: number,
): Promise<ApiResult<ProposalVoteItem[]>> {
  if (USE_MOCK) return mock.listVotes(id, limit);
  return call<ProposalVoteItem[]>(`/proposals/${id}/votes`, {
    query: limit !== undefined ? { limit: String(limit) } : undefined,
  }).then((r) =>
    r.ok ? { ok: true, data: r.data.map(normalizeVoteItem) } : r,
  );
}

export function getMyVote(id: number, token: string): Promise<ApiResult<ProposalVoteItem | null>> {
  if (USE_MOCK) return mock.getMyVote(id);
  return call<ProposalVoteItem>(`/proposals/${id}/votes/me`, { token }).then((r) => {
    if (!r.ok && r.code === ErrCode.PROPOSAL_VOTE_NOT_FOUND) {
      return { ok: true, data: null };
    }
    return r.ok ? { ok: true, data: normalizeVoteItem(r.data) } : r;
  });
}

export function castVote(
  id: number,
  input: CastVoteInput,
  token: string,
): Promise<ApiResult<ProposalVoteItem>> {
  if (USE_MOCK) return mock.castVote(id, input);
  return call<ProposalVoteItem>(`/proposals/${id}/votes`, {
    method: "POST",
    token,
    body: input,
  }).then((r) => (r.ok ? { ok: true, data: normalizeVoteItem(r.data) } : r));
}

export function listComments(
  id: number,
  limit?: number,
): Promise<ApiResult<ProposalCommentItem[]>> {
  if (USE_MOCK) return mock.listComments(id, limit);
  return call<ProposalCommentItem[]>(`/proposals/${id}/comments`, {
    query: limit !== undefined ? { limit: String(limit) } : undefined,
  }).then((r) =>
    r.ok ? { ok: true, data: r.data.map(normalizeCommentItem) } : r,
  );
}

export function createComment(
  id: number,
  input: CreateCommentInput,
  token: string,
): Promise<ApiResult<ProposalCommentItem>> {
  if (USE_MOCK) return mock.createComment(id, input);
  return call<ProposalCommentItem>(`/proposals/${id}/comments`, {
    method: "POST",
    token,
    body: input,
  }).then((r) => (r.ok ? { ok: true, data: normalizeCommentItem(r.data) } : r));
}

// ── Mock branch ───────────────────────────────────────────────────────────────

type MockStore = {
  proposals: ProposalDetail[];
  nextId: number;
};

const MOCK_VOTERS = [
  "young.seedao",
  "tanghan.seedao",
  "baiyu.seedao",
  "shawn.seedao",
  "lizi.seedao",
];

function buildMockStore(): MockStore {
  const now = Date.now();
  const hour = 3600_000;

  const content1 = encodeProposalContent({
    background:
      "SeeDAO S11 市政厅任期即将结束，S12 市政厅需要选举产生新一届成员。S12 市政厅将负责 AI 探索、游戏化与付费会员等方向的推进。",
    body: `## 提名成员

拟选举以下成员组成 S12 市政厅：

**S12 主理人**
白鱼

**S12 联合主理人**
唐晗`,
    remarks:
      "S12 市政厅任期为 6 个月。本提案为过渡期的选举安排，正式规则以社区文档为准。",
  });
  const options1 = encodeVoteOptions(["同意", "反对", "弃权"]);

  const passed: ProposalDetail = {
    id: 362,
    title: "选举 SeeDAO S12 市政厅成员",
    proposer_sns: "baiyu.seedao",
    type: "node_consensus_rule",
    status: "vote_passed",
    created_at: "2026-06-11T02:07:00Z",
    updated_at: "2026-06-15T08:00:00Z",
    published_at: "2026-06-12T02:07:00Z",
    publicity_end_at: "2026-06-16T02:07:00Z",
    vote_end_at: "2026-06-18T02:07:00Z",
    resolution_rule: "node_assembly_standard",
    vote_type: 1,
    content: content1,
    vote_options: options1,
    vote_summary: {
      total_votes: 12,
      valid_votes: 12,
      approve_count: 12,
      reject_count: 0,
      abstain_count: 0,
      approve_rate: 1,
      participation_rate: 0.75,
      by_result: { 同意: 12, 反对: 0, 弃权: 0 },
      passed: true,
      resolved: true,
      resolution_rule: "node_assembly_standard",
      resolution_reason: '投票结束，选项"同意"胜出',
    },
    votes: MOCK_VOTERS.slice(0, 5).map((sns, i) => ({
      id: i + 1,
      sns_name: sns,
      vote_result: "同意",
      vote_weight: 1,
      voted_at: "2026-06-17T10:00:00Z",
    })),
    comments: [],
  };

  const voting: ProposalDetail = {
    id: 401,
    title: "S13 季度节点共识大会议程确认",
    proposer_sns: "tanghan.seedao",
    type: "node_consensus_rule",
    status: "voting",
    created_at: "2026-07-01T08:00:00Z",
    published_at: "2026-07-02T08:00:00Z",
    publicity_end_at: "2026-07-06T08:00:00Z",
    vote_end_at: "2026-07-08T08:00:00Z",
    resolution_rule: "node_assembly_standard",
    vote_type: 1,
    content: encodeProposalContent({
      background: "S13 节点共识大会即将召开，需确认大会议程。",
      body: "请节点确认以下议程安排是否合理。",
      remarks: "",
    }),
    vote_options: encodeVoteOptions(["确认", "需修改", "弃权"]),
    vote_summary: {
      total_votes: 8,
      valid_votes: 8,
      approve_count: 6,
      reject_count: 1,
      abstain_count: 1,
      approve_rate: 0.75,
      participation_rate: 0.5,
      by_result: { 确认: 6, 需修改: 1, 弃权: 1 },
      passed: false,
      resolved: false,
      resolution_rule: "node_assembly_standard",
    },
    votes: MOCK_VOTERS.slice(0, 3).map((sns, i) => ({
      id: i + 10,
      sns_name: sns,
      vote_result: "确认",
      vote_weight: 1,
      voted_at: "2026-07-07T08:00:00Z",
    })),
    comments: [
      {
        id: 1,
        sns_name: "young.seedao",
        content: "议程安排合理，支持。",
        commented_at: "2026-07-03T12:00:00Z",
      },
    ],
  };

  const draft: ProposalDetail = {
    id: 450,
    title: "市政厅 Q3 预算分配方案（草稿）",
    proposer_sns: "demo.seedao",
    type: "town_hall_meeting",
    status: "draft",
    created_at: "2026-07-05T10:00:00Z",
    resolution_rule: "town_hall_standard",
    vote_type: 1,
    content: encodeProposalContent({
      background: "Q3 预算需要提前规划。",
      body: "拟将 40% 用于 AI 工具采购，30% 用于活动，30% 用于运营。",
      remarks: "",
    }),
    vote_options: encodeVoteOptions(["同意", "反对", "弃权"]),
  };

  const multiVoting: ProposalDetail = {
    id: 402,
    title: "S13 社区活动主题多选调研",
    proposer_sns: "young.seedao",
    type: "town_hall_meeting",
    status: "voting",
    created_at: "2026-07-04T08:00:00Z",
    published_at: "2026-07-05T08:00:00Z",
    publicity_end_at: "2026-07-08T08:00:00Z",
    vote_end_at: "2026-07-10T08:00:00Z",
    resolution_rule: "town_hall_standard",
    vote_type: 2,
    content: encodeProposalContent({
      background: "S13 计划举办系列社区活动，需调研成员偏好主题（可多选）。",
      body: "请从以下主题中选择你感兴趣的方向，可多选。",
      remarks: "",
    }),
    vote_options: encodeVoteOptions(["AI 共学", "游戏化", "线下聚会", "付费会员"]),
    vote_summary: {
      total_votes: 5,
      valid_votes: 5,
      approve_count: 0,
      reject_count: 0,
      abstain_count: 0,
      approve_rate: 0,
      participation_rate: 0.35,
      by_result: { "AI 共学": 4, 游戏化: 3, 线下聚会: 2, 付费会员: 1 },
      passed: false,
      resolved: false,
      resolution_rule: "town_hall_standard",
    },
    votes: [],
    comments: [],
  };

  const publicityLive: ProposalDetail = {
    id: 403,
    title: "S13 社区贡献者激励方案（公示中）",
    proposer_sns: "baiyu.seedao",
    type: "node_consensus_rule",
    status: "publicity",
    created_at: new Date(now - 2 * hour).toISOString(),
    published_at: new Date(now - hour).toISOString(),
    publicity_end_at: new Date(now + 2 * hour).toISOString(),
    publicity_seconds: 3 * 3600,
    vote_duration_seconds: 48 * 3600,
    vote_end_at: new Date(now + 2 * hour + 48 * 3600 * 1000).toISOString(),
    resolution_rule: "node_assembly_standard",
    vote_type: 1,
    content: encodeProposalContent({
      background: "为激励 S13 活跃贡献者，拟设立季度激励池。",
      body: "详见提案内容，公示期结束后进入投票。",
      remarks: "",
    }),
    vote_options: encodeVoteOptions(["同意", "反对", "弃权"]),
  };

  const votingExpired: ProposalDetail = {
    id: 404,
    title: "S12 季度复盘报告（待结票）",
    proposer_sns: "shawn.seedao",
    type: "town_hall_meeting",
    status: "voting",
    created_at: new Date(now - 72 * hour).toISOString(),
    published_at: new Date(now - 70 * hour).toISOString(),
    publicity_end_at: new Date(now - 48 * hour).toISOString(),
    vote_end_at: new Date(now - hour).toISOString(),
    resolution_rule: "town_hall_standard",
    vote_type: 1,
    content: encodeProposalContent({
      background: "S12 季度复盘，投票期已结束，等待结票。",
      body: "本提案将在访问时自动结票。",
      remarks: "",
    }),
    vote_options: encodeVoteOptions(["通过", "不通过", "弃权"]),
    vote_summary: {
      total_votes: 3,
      valid_votes: 3,
      approve_count: 2,
      reject_count: 1,
      abstain_count: 0,
      approve_rate: 0.67,
      participation_rate: 0.4,
      by_result: { 通过: 2, 不通过: 1, 弃权: 0 },
      passed: false,
      resolved: false,
      resolution_rule: "town_hall_standard",
    },
    votes: [],
    comments: [],
  };

  return { proposals: [passed, voting, multiVoting, publicityLive, votingExpired, draft], nextId: 451 };
}

const store: MockStore = buildMockStore();

function toListItem(p: ProposalDetail) {
  const sipMatch = p.title.match(/SIP-(\d+)/i);
  return {
    id: p.id,
    title: p.title,
    proposer_sns: p.proposer_sns,
    created_at: p.created_at,
    type: p.type,
    status: p.status,
    sip: sipMatch?.[1],
    vote_count: p.vote_summary?.total_votes ?? p.votes?.length ?? 0,
    comment_count: p.comments?.length ?? 0,
    published_at: p.published_at,
    publicity_end_at: p.publicity_end_at,
    vote_end_at: p.vote_end_at,
  };
}

const mock = {
  listProposals(q: ListProposalsQuery): Promise<ApiResult<ProposalListResult>> {
    for (const p of store.proposals) syncProposalLifecycle(p);
    let items = store.proposals.map(toListItem);
    if (q.type) items = items.filter((i) => i.type === q.type);
    if (q.status) items = items.filter((i) => i.status === q.status);
    const sip = normalizeSipQuery(q.sip);
    if (sip) items = items.filter((i) => sipOfItem(i) === sip);
    const keyword = normalizeKeyword(q.keyword);
    if (keyword) items = items.filter((i) => matchesKeyword(i, keyword));
    items.sort((a, b) => b.id - a.id);
    const limit = q.limit ?? 20;
    if (q.before_id !== undefined && !keyword && !sip) {
      const before = q.before_id;
      items = items.filter((i) => i.id < before);
    }
    const slice = items.slice(0, limit);
    const next = !keyword && !sip && items.length > limit ? slice[slice.length - 1]?.id : undefined;
    return Promise.resolve({
      ok: true,
      data: { items: slice, next_before: next },
    });
  },

  getProposal(
    id: number,
    opts?: { include_votes?: boolean; include_comments?: boolean },
  ): Promise<ApiResult<ProposalDetail>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p) return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    syncProposalLifecycle(p);
    const detail: ProposalDetail = { ...p };
    if (!opts?.include_votes) delete detail.votes;
    if (!opts?.include_comments) delete detail.comments;
    return Promise.resolve({ ok: true, data: detail });
  },

  createProposal(input: CreateProposalInput): Promise<ApiResult<ProposalResponse>> {
    const p: ProposalDetail = {
      id: store.nextId++,
      title: input.title,
      proposer_sns: "demo.seedao",
      type: input.type,
      status: "draft",
      created_at: new Date().toISOString(),
      resolution_rule: input.resolution_rule,
      vote_type: input.vote_type,
      content: input.content,
      vote_options: input.vote_options,
    };
    store.proposals.unshift(p);
    return Promise.resolve({ ok: true, data: p });
  },

  updateProposal(id: number, input: UpdateProposalInput): Promise<ApiResult<ProposalResponse>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p || p.status !== "draft") {
      return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    }
    if (input.title !== undefined) p.title = input.title;
    if (input.content !== undefined) p.content = input.content;
    if (input.vote_options !== undefined) p.vote_options = input.vote_options;
    if (input.vote_type !== undefined) p.vote_type = input.vote_type;
    p.updated_at = new Date().toISOString();
    return Promise.resolve({ ok: true, data: p });
  },

  publishProposal(id: number, input: PublishProposalInput): Promise<ApiResult<ProposalResponse>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p || p.status !== "draft") {
      return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    }
    const now = Date.now();
    const pubSec = input.publicity_seconds ?? 96 * 3600;
    const voteSec = input.vote_duration_seconds ?? 48 * 3600;
    p.status = "publicity";
    p.published_at = new Date(now).toISOString();
    p.publicity_seconds = pubSec;
    p.publicity_end_at = new Date(now + pubSec * 1000).toISOString();
    p.vote_duration_seconds = voteSec;
    p.vote_end_at = new Date(now + (pubSec + voteSec) * 1000).toISOString();
    return Promise.resolve({ ok: true, data: p });
  },

  closeProposal(id: number): Promise<ApiResult<ProposalResponse>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p) return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    if (p.status !== "draft") {
      return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    }
    p.status = "withdrawn";
    p.updated_at = new Date().toISOString();
    return Promise.resolve({ ok: true, data: p });
  },

  finalizeProposal(id: number): Promise<ApiResult<ProposalDetail>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p) return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    if (p.status !== "voting") {
      return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    }
    finalizeProposalTally(p);
    return Promise.resolve({ ok: true, data: { ...p } });
  },

  getVoteSummary(id: number): Promise<ApiResult<VoteTally>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p?.vote_summary) {
      return Promise.resolve({
        ok: true,
        data: {
          total_votes: 0,
          valid_votes: 0,
          approve_count: 0,
          reject_count: 0,
          abstain_count: 0,
          approve_rate: 0,
          participation_rate: 0,
          by_result: {},
          passed: false,
          resolved: false,
          resolution_rule: p?.resolution_rule ?? "",
        },
      });
    }
    return Promise.resolve({ ok: true, data: p.vote_summary });
  },

  listVotes(id: number, _limit?: number): Promise<ApiResult<ProposalVoteItem[]>> {
    const p = store.proposals.find((x) => x.id === id);
    return Promise.resolve({ ok: true, data: p?.votes ?? [] });
  },

  getMyVote(id: number): Promise<ApiResult<ProposalVoteItem | null>> {
    const p = store.proposals.find((x) => x.id === id);
    const vote = p?.votes?.find((v) => v.sns_name === "demo.seedao");
    if (!vote) return Promise.resolve({ ok: true, data: null });
    return Promise.resolve({ ok: true, data: vote });
  },

  castVote(id: number, input: CastVoteInput): Promise<ApiResult<ProposalVoteItem>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p) return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });

    const prev = p.votes?.find((v) => v.sns_name === "demo.seedao");
    if (prev && p.vote_summary) {
      const parts = prev.vote_result.includes(",")
        ? prev.vote_result.split(",")
        : [prev.vote_result];
      for (const part of parts) {
        const key = part.trim();
        if (p.vote_summary.by_result[key]) {
          p.vote_summary.by_result[key] -= 1;
        }
      }
      p.vote_summary.total_votes = Math.max(0, p.vote_summary.total_votes - 1);
    }

    const item: ProposalVoteItem = {
      id: Date.now(),
      sns_name: "demo.seedao",
      vote_result: input.vote_result,
      vote_weight: 1,
      voted_at: new Date().toISOString(),
    };
    p.votes = [...(p.votes ?? []).filter((v) => v.sns_name !== "demo.seedao"), item];

    if (p.vote_summary) {
      p.vote_summary.total_votes += 1;
      const parts = input.vote_result.includes(",")
        ? input.vote_result.split(",")
        : [input.vote_result];
      for (const part of parts) {
        const key = part.trim();
        if (!key) continue;
        p.vote_summary.by_result[key] = (p.vote_summary.by_result[key] ?? 0) + 1;
      }
    }
    return Promise.resolve({ ok: true, data: item });
  },

  listComments(id: number, _limit?: number): Promise<ApiResult<ProposalCommentItem[]>> {
    const p = store.proposals.find((x) => x.id === id);
    return Promise.resolve({ ok: true, data: p?.comments ?? [] });
  },

  createComment(id: number, input: CreateCommentInput): Promise<ApiResult<ProposalCommentItem>> {
    const p = store.proposals.find((x) => x.id === id);
    if (!p) return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });
    const item: ProposalCommentItem = {
      id: Date.now(),
      sns_name: "demo.seedao",
      content: input.content,
      commented_at: new Date().toISOString(),
      is_reject: input.is_reject,
      parent_id: input.parent_id,
    };
    p.comments = [...(p.comments ?? []), item];
    return Promise.resolve({ ok: true, data: item });
  },
};
