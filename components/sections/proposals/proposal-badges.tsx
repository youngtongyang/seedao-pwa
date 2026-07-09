"use client";

import { cn } from "@/lib/utils";
import { PROPOSAL_STATUSES } from "@/lib/proposals/constants";
import type { ProposalStatus } from "@/lib/proposals/types";
import {
  proposalStatusLabel,
  proposalTypeLabel,
  proposalTypeTag,
  useProposalCopy,
} from "@/lib/proposals/use-proposal-copy";

export function ProposalStatusBadge({ status }: { status: string }) {
  const copy = useProposalCopy();
  const meta = PROPOSAL_STATUSES[status as ProposalStatus];
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center truncate rounded-md px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs",
        meta?.className ?? "bg-muted text-muted-foreground",
      )}
    >
      {proposalStatusLabel(copy, status)}
    </span>
  );
}

export function ProposalTypeBadge({ type }: { type: string }) {
  const copy = useProposalCopy();
  return (
    <span className="inline-flex max-w-full shrink-0 items-center truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:px-2.5 sm:text-xs">
      {proposalTypeTag(copy, type)}
    </span>
  );
}

export function ProposalTypeLabel({ type }: { type: string }) {
  const copy = useProposalCopy();
  return <>{proposalTypeLabel(copy, type)}</>;
}
