"use client";

import { formatDateTime } from "@/lib/proposals/constants";
import { formatResolutionReason } from "@/lib/proposals/resolution-reason";
import {
  buildProposalHistory,
  type HistoryLabels,
  type ProposalHistoryEvent,
} from "@/lib/proposals/lifecycle";
import type { ProposalDetail } from "@/lib/proposals/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function HistoryItem({
  event,
  last,
  reasonCopy,
}: {
  event: ProposalHistoryEvent;
  last: boolean;
  reasonCopy: Parameters<typeof formatResolutionReason>[1];
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && (
        <span
          className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "relative z-10 mt-1 size-[22px] shrink-0 rounded-full border-2 border-primary bg-background",
          event.kind === "withdrawn" && "border-muted-foreground",
          (event.kind === "passed" || event.kind === "failed") && "border-primary bg-primary/10",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold">{event.label}</span>
          <time className="text-xs text-muted-foreground">{formatDateTime(event.at)}</time>
        </div>
        {event.detail && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {formatResolutionReason(event.detail, reasonCopy)}
          </p>
        )}
      </div>
    </li>
  );
}

export function ProposalHistoryPanel({ proposal }: { proposal: ProposalDetail }) {
  const t = useT();
  const labels = t.proposals.historyEvents as HistoryLabels;
  const events = buildProposalHistory(proposal, labels);

  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground">{t.proposals.detail.historyEmpty}</p>
    );
  }

  return (
    <ol className="space-y-0">
      {events.map((event, i) => (
        <HistoryItem key={event.id} event={event} last={i === events.length - 1} reasonCopy={t.proposals.resolutionReasons} />
      ))}
    </ol>
  );
}
