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
        "group rounded-xl border border-border bg-card transition-colors sm:rounded-2xl",
        "hover:border-primary/30 hover:bg-muted/20",
      )}
    >
      <Link href={href} className="block p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold leading-snug group-hover:text-primary sm:text-lg">
              {item.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:hidden">
              <ProposalTypeBadge type={item.type} />
              <ProposalStatusBadge status={item.status} />
            </div>

            <div className="mt-2.5 flex items-center gap-2 sm:mt-3">
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary sm:size-8 sm:text-xs"
                aria-hidden
              >
                {(item.proposer_sns || "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 truncate text-xs text-muted-foreground sm:text-sm">
                <span className="font-medium text-foreground">{item.proposer_sns}</span>
                <span className="mx-1.5 text-border sm:mx-2">·</span>
                <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 flex-wrap items-center gap-2 sm:flex sm:flex-col sm:items-end">
            <ProposalTypeBadge type={item.type} />
            <ProposalStatusBadge status={item.status} />
          </div>
        </div>
      </Link>

      {isUnsubmitted && isMine && (
        <div className="border-t border-border px-4 py-2.5 sm:px-5 sm:py-3">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs sm:h-9 sm:text-sm">
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
