"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { formatDateTime, isUnsubmittedDraft, snsEquals } from "@/lib/proposals/constants";
import type { ProposalListItem } from "@/lib/proposals/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProposalStatusBadge, ProposalTypeBadge } from "./proposal-badges";

export function ProposalCard({
  item,
  mySns,
}: {
  item: ProposalListItem;
  mySns?: string | null;
}) {
  const t = useT();
  const isUnsubmitted = isUnsubmittedDraft(item.status);
  const isMine = snsEquals(item.proposer_sns, mySns);
  const href = isUnsubmitted && isMine ? `/proposals/new?id=${item.id}` : `/proposals/${item.id}`;

  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-card transition-colors",
        "hover:border-primary/30 hover:bg-muted/20",
      )}
    >
      <Link href={href} className="block p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-snug group-hover:text-primary sm:text-lg">
              {item.title}
            </h3>
            <div className="mt-3 flex items-center gap-2.5">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                aria-hidden
              >
                {(item.proposer_sns || "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{item.proposer_sns}</span>
                <span className="mx-2 text-border">·</span>
                <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <ProposalTypeBadge type={item.type} />
            <ProposalStatusBadge status={item.status} />
          </div>
        </div>
      </Link>

      {isUnsubmitted && isMine && (
        <div className="border-t border-border px-5 py-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/proposals/new?id=${item.id}`}>
              <Pencil className="size-3.5" />
              {t.proposals.detail.editDraft}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
