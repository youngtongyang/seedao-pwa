"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PROPOSAL_TYPES, VOTE_TYPES } from "@/lib/proposals/constants";
import type { CreatableProposalType, VoteType } from "@/lib/proposals/types";
import { useT } from "@/lib/i18n";
import { ProposalRulesBody } from "./proposal-rules-body";

export function RuleTypeDialog({
  open,
  type,
  voteType,
  onVoteTypeChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  type: CreatableProposalType;
  voteType: VoteType;
  onVoteTypeChange: (v: VoteType) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const meta = PROPOSAL_TYPES[type];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {meta.label}
            {t.proposals.create.ruleSuffix}
          </DialogTitle>
        </DialogHeader>
        <ProposalRulesBody
          resolutionRule={meta.resolutionRule}
          proposalType={type}
          voteType={voteType}
        />
        <div className="space-y-3 pt-2">
          <p className="text-sm font-semibold">{t.proposals.create.selectVoteType}</p>
          {([1, 2] as const).map((vt) => (
            <label
              key={vt}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary"
            >
              <input
                type="radio"
                name="vote_type"
                checked={voteType === vt}
                onChange={() => onVoteTypeChange(vt)}
                className="accent-primary"
              />
              <span className="text-sm">{VOTE_TYPES[vt].label}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t.common.back}
          </Button>
          <Button onClick={onConfirm}>{t.proposals.create.confirmCreate}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
