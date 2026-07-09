/**
 * Proposal domain DTOs (snake_case, matching backend wire format).
 * Shared API errcodes live in `lib/api/types.ts`; proposal payloads live here.
 */

/** Internal proposal type keys (creatable + display-only). */
export type ProposalType =
  | "node_consensus_rule"
  | "node_consensus_special"
  | "town_hall_meeting"
  | "p1_project_init"
  | "p2_project_init"
  | "p2_project_close"
  | "p3_project_init"
  | "p3_project_close"
  | "p3_special"
  | "town_hall_evaluation";

/** Types shown on the create flow. */
export const CREATABLE_PROPOSAL_TYPES = [
  "node_consensus_rule",
  "node_consensus_special",
  "town_hall_meeting",
] as const satisfies readonly ProposalType[];

export type CreatableProposalType = (typeof CREATABLE_PROPOSAL_TYPES)[number];

/** Per-type create permission from GET /v1/governance/proposal-permissions. */
export type ProposalCreatePermissions = {
  sns_name: string;
  can_create_any: boolean;
  create_types: Partial<Record<CreatableProposalType, boolean>>;
};

export type ProposalTypeGroup = {
  id: string;
  types: CreatableProposalType[];
};

export type ProposalStatus =
  | "pending_submit"
  | "draft"
  | "publicity"
  | "voting"
  | "vote_passed"
  | "vote_failed"
  | "rejected"
  | "withdrawn"
  | "pending_execution"
  | "execution_failed"
  | "vetoed";

/** 1 = single choice, 2 = multiple choice */
export type VoteType = 1 | 2;

export type ProposalContent = {
  background: string;
  body: string;
  remarks: string;
  /** Legacy P1/P2/P3 template blocks from the API. */
  blocks?: ProposalContentBlock[];
  vote_type?: VoteType;
  vote_options?: string[];
};

export type MotivationBudgetItem = {
  amount?: string;
  address?: string;
  assetInfo?: { id?: number; name?: string };
  description?: string;
};

export type ProposalContentBlock = {
  id?: number;
  type?: string;
  title?: string;
  content?: string;
  component?: string;
  component_list?: string;
  data?: {
    applicant?: string;
    proposal_id?: string;
    budgetList?: MotivationBudgetItem[];
  };
};

export type ProposalListItem = {
  id: number;
  title: string;
  proposer_sns: string;
  created_at: string;
  type: string;
  status: string;
  sip?: string;
  vote_count: number;
  comment_count: number;
  published_at?: string;
  publicity_end_at?: string;
  vote_end_at?: string;
};

export type ProposalListResult = {
  items: ProposalListItem[];
  next_before?: number;
};

export type ProposalVoteItem = {
  id: number;
  sns_name: string;
  vote_result: string;
  vote_weight: number;
  voted_at: string;
  voter_wallet?: string;
};

export type ProposalCommentItem = {
  id: number;
  sns_name: string;
  author_wallet?: string;
  content: string;
  commented_at: string;
  is_reject?: boolean;
  parent_id?: number;
  replies?: ProposalCommentItem[];
};

export type VoteTally = {
  total_votes: number;
  valid_votes: number;
  approve_count: number;
  reject_count: number;
  abstain_count: number;
  approve_rate: number;
  participation_rate: number;
  by_result: Record<string, number>;
  passed: boolean;
  resolved: boolean;
  resolution_rule: string;
  resolution_reason?: string;
};

export type ProposalDetail = {
  id: number;
  title: string;
  proposer_sns: string;
  proposer_wallet?: string;
  type: string;
  status: string;
  created_at: string;
  updated_at?: string;
  published_at?: string;
  publicity_end_at?: string;
  publicity_seconds?: number;
  vote_end_at?: string;
  vote_duration_seconds?: number;
  resolution_rule?: string;
  vote_type?: VoteType;
  content: number[];
  vote_options?: number[];
  vote_summary?: VoteTally;
  votes?: ProposalVoteItem[];
  comments?: ProposalCommentItem[];
};

export type ProposalResponse = Omit<
  ProposalDetail,
  "vote_summary" | "votes" | "comments"
>;

export type CreateProposalInput = {
  title: string;
  type: CreatableProposalType;
  resolution_rule: string;
  vote_type: VoteType;
  content: number[];
  vote_options: number[];
};

export type UpdateProposalInput = {
  title?: string;
  content?: number[];
  vote_options?: number[];
  vote_type?: VoteType;
};

export type PublishProposalInput = {
  publicity_seconds?: number;
  vote_duration_seconds?: number;
};

export type CastVoteInput = {
  vote_result: string;
};

export type CreateCommentInput = {
  content: string;
  is_reject?: boolean;
  parent_id?: number;
};

export type ListProposalsQuery = {
  limit?: number;
  before_id?: number;
  type?: string;
  status?: string;
  sip?: string;
  keyword?: string;
};
