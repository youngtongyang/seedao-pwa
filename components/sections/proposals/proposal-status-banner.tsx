"use client";

import { useEffect, useState } from "react";
import { useI18n, useT } from "@/lib/i18n";
import {
  activePhase,
  formatCountdown,
  msUntil,
} from "@/lib/proposals/lifecycle";
import type { ProposalDetail, ProposalStatus } from "@/lib/proposals/types";
import { cn } from "@/lib/utils";

export function ProposalStatusBanner({
  proposal,
  onPhaseChange,
}: {
  proposal: ProposalDetail;
  onPhaseChange?: () => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const phase = activePhase(proposal.status as ProposalStatus);
  const [remaining, setRemaining] = useState<number | null>(null);

  const deadline =
    phase === "publicity"
      ? proposal.publicity_end_at
      : phase === "voting"
        ? proposal.vote_end_at
        : undefined;

  useEffect(() => {
    if (!phase || !deadline) {
      setRemaining(null);
      return;
    }

    function tick() {
      const ms = msUntil(deadline);
      setRemaining(ms);
      if (ms !== null && ms <= 0) onPhaseChange?.();
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, deadline, onPhaseChange]);

  if (!phase || remaining === null) return null;

  const ended = remaining <= 0;

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-1 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        phase === "publicity"
          ? "border-accent/30 bg-accent/10"
          : "border-primary/30 bg-primary/10",
      )}
    >
      <p className="text-sm font-semibold">
        {phase === "publicity" ? t.proposals.detail.publicityPhase : t.proposals.detail.votingPhase}
      </p>
      <p className="text-sm tabular-nums text-muted-foreground">
        {ended
          ? t.proposals.detail.phaseEnding
          : t.proposals.detail.phaseRemaining.replace(
              "{time}",
              formatCountdown(remaining, locale),
            )}
      </p>
    </div>
  );
}
