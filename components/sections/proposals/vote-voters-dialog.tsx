"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProposalVoteItem } from "@/lib/proposals/types";
import { useT } from "@/lib/i18n";

export function VoteVotersDialog({
  open,
  onOpenChange,
  votes,
  total,
  optionLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  votes: ProposalVoteItem[];
  total: number;
  /** When set, dialog title reflects the filtered option. */
  optionLabel?: string | null;
}) {
  const t = useT();
  const title = optionLabel
    ? t.proposals.detail.votersForOption.replace("{option}", optionLabel).replace("{n}", String(total))
    : t.proposals.detail.votersAll.replace("{n}", String(total));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ul className="max-h-[50vh] overflow-y-auto divide-y divide-border">
          {votes.map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(v.sns_name || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.sns_name}</span>
              <span className="shrink-0 tabular-nums text-sm text-muted-foreground">
                {v.vote_weight}
              </span>
            </li>
          ))}
          {!votes.length && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              {t.proposals.detail.votersEmpty}
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
