"use client";

import { useT } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/messages";
import { normalizeProposalType, normalizeVoteType } from "./constants";
import type { ProposalStatus, ProposalType } from "./types";

export type ProposalCopy = Messages["proposals"];

export function useProposalCopy(): ProposalCopy {
  return useT().proposals;
}

export function proposalTypeLabel(copy: ProposalCopy, type: string): string {
  const id = normalizeProposalType(type) as ProposalType;
  return copy.types[id] ?? type;
}

export function proposalTypeTag(copy: ProposalCopy, type: string): string {
  const id = normalizeProposalType(type) as ProposalType;
  return copy.typeTags[id] ?? proposalTypeLabel(copy, type);
}

export function proposalStatusLabel(copy: ProposalCopy, status: string): string {
  return copy.statuses[status as ProposalStatus] ?? status;
}

export function proposalVoteTypeLabel(copy: ProposalCopy, voteType: unknown): string {
  return normalizeVoteType(voteType) === 2 ? copy.voteTypes.multi : copy.voteTypes.single;
}
