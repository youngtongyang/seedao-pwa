"use client";

import { Progress } from "@/components/ui/progress";
import { useT } from "@/lib/i18n";
import type { VoteTally } from "@/lib/proposals/types";
import { cn } from "@/lib/utils";
export function VoteSummaryPanel({
  summary,
  options,
  title,
  onShowVotersForOption,
  onShowRules,
}: {
  summary: VoteTally;
  options: string[];
  title?: string;
  onShowVotersForOption?: (option: string) => void;
  onShowRules?: () => void;
}) {
  const t = useT();
  const total = summary.total_votes;
  const maxCount = Math.max(...Object.values(summary.by_result), 1);
  const winner = Object.entries(summary.by_result).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">
          {t.proposals.detail.totalVotes.replace("{n}", String(total))}
        </p>
        {!summary.resolved && summary.total_votes > 0 && winner && (
          <p className="text-sm text-muted-foreground">
            {t.proposals.detail.currentLeader.replace("{option}", winner)}
          </p>
        )}
      </div>

      {title && <p className="mb-4 text-xs text-muted-foreground">{title}</p>}

      <div className="space-y-4">
        {(options.length ? options : Object.keys(summary.by_result)).map((opt) => {
          const count = summary.by_result[opt] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const clickable = count > 0 && onShowVotersForOption;
          return (
            <div key={opt}>
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onShowVotersForOption(opt) : undefined}
                className={cn(
                  "w-full rounded-lg text-left transition-colors",
                  clickable && "cursor-pointer hover:bg-muted/40",
                  !clickable && "cursor-default",
                )}
              >
                <div className="mb-1.5 flex items-center justify-between px-1 text-sm">
                  <span>{opt}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {count} ({pct}%)
                  </span>
                </div>
                <Progress value={barPct} className="h-2" />
              </button>
            </div>
          );
        })}
      </div>

      {onShowRules && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onShowRules}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t.proposals.rules.viewLink}
          </button>
        </div>
      )}
    </div>
  );
}
