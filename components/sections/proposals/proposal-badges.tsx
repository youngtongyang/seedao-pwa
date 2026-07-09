import { cn } from "@/lib/utils";
import { PROPOSAL_STATUSES, typeLabel, typeTag } from "@/lib/proposals/constants";
import type { ProposalStatus } from "@/lib/proposals/types";

export function ProposalStatusBadge({ status }: { status: string }) {
  const meta = PROPOSAL_STATUSES[status as ProposalStatus];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        meta?.className ?? "bg-muted text-muted-foreground",
      )}
    >
      {meta?.label ?? status}
    </span>
  );
}

export function ProposalTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {typeTag(type)}
    </span>
  );
}

export function ProposalTypeLabel({ type }: { type: string }) {
  return <>{typeLabel(type)}</>;
}
