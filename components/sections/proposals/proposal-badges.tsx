import { cn } from "@/lib/utils";
import { PROPOSAL_STATUSES, typeLabel, typeTag } from "@/lib/proposals/constants";
import type { ProposalStatus } from "@/lib/proposals/types";

export function ProposalStatusBadge({ status }: { status: string }) {
  const meta = PROPOSAL_STATUSES[status as ProposalStatus];
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center truncate rounded-md px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs",
        meta?.className ?? "bg-muted text-muted-foreground",
      )}
    >
      {meta?.label ?? status}
    </span>
  );
}

export function ProposalTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex max-w-full shrink-0 items-center truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:px-2.5 sm:text-xs">
      {typeTag(type)}
    </span>
  );
}

export function ProposalTypeLabel({ type }: { type: string }) {
  return <>{typeLabel(type)}</>;
}
