"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { VOTE_TYPES } from "@/lib/proposals/constants";
import type { VoteType } from "@/lib/proposals/types";
import { cn } from "@/lib/utils";

export function VoteDialog({
  open,
  onOpenChange,
  options,
  voteType,
  selected,
  onSelectedChange,
  onConfirm,
  voting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: string[];
  voteType: VoteType;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  onConfirm: () => void;
  voting: boolean;
}) {
  const t = useT();
  const multi = voteType === 2;

  function toggle(opt: string) {
    if (!multi) {
      onSelectedChange([opt]);
      return;
    }
    onSelectedChange(
      selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt],
    );
  }

  const canSubmit = selected.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.proposals.detail.voteTitle}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {VOTE_TYPES[voteType].label}
            {multi && ` · ${t.proposals.detail.multiHint}`}
          </p>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  name="vote"
                  value={opt}
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">{opt}</span>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.back}
          </Button>
          <Button disabled={!canSubmit || voting} onClick={onConfirm}>
            {voting ? <Loader2 className="size-4 animate-spin" /> : t.proposals.detail.confirmVote}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
