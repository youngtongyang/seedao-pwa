/** Encode/decode vote selections for single vs multi-choice proposals. */

import { normalizeVoteType } from "./constants";
import type { ProposalVoteItem } from "./types";

const MULTI_SEP = ",";

export function encodeVoteResult(selected: string[], multi: boolean): string {
  if (!selected.length) return "";
  return multi ? selected.join(MULTI_SEP) : selected[0];
}

export function decodeVoteResult(result: string, multi: boolean): string[] {
  if (!result) return [];
  if (!multi) return [result];
  return result.split(MULTI_SEP).map((s) => s.trim()).filter(Boolean);
}

export function isMultiVote(voteType: unknown): boolean {
  return normalizeVoteType(voteType) === 2;
}

/** Votes that include a given option (handles single and multi-choice). */
export function filterVotesByOption(
  votes: ProposalVoteItem[],
  option: string,
  multi: boolean,
): ProposalVoteItem[] {
  return votes.filter((v) => decodeVoteResult(v.vote_result, multi).includes(option));
}
