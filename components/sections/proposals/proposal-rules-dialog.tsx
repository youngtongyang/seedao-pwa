"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getResolutionRuleMeta } from "@/lib/proposals/rules";
import type { VoteType } from "@/lib/proposals/types";
import { useT } from "@/lib/i18n";
import { ProposalRulesBody } from "./proposal-rules-body";

export function ProposalRulesDialog({
  open,
  onOpenChange,
  resolutionRule,
  proposalType,
  voteType,
  backendRuleText,
  publicitySeconds,
  voteDurationSeconds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolutionRule?: string;
  proposalType?: string;
  voteType?: VoteType;
  backendRuleText?: string;
  publicitySeconds?: number;
  voteDurationSeconds?: number;
}) {
  const t = useT();
  const ruleKey = resolutionRule || backendRuleText;
  const meta = getResolutionRuleMeta(ruleKey, proposalType, {
    publicitySeconds,
    voteDurationSeconds,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {meta?.label ?? t.proposals.rules.title}
            {t.proposals.create.ruleSuffix}
          </DialogTitle>
        </DialogHeader>
        <ProposalRulesBody
          resolutionRule={resolutionRule}
          proposalType={proposalType}
          voteType={voteType}
          backendRuleText={backendRuleText}
          publicitySeconds={publicitySeconds}
          voteDurationSeconds={voteDurationSeconds}
        />
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.proposals.rules.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
