"use client";

import { normalizeVoteType, VOTE_TYPES } from "@/lib/proposals/constants";
import { getResolutionRuleMeta, getVoteTypeLabel } from "@/lib/proposals/rules";
import type { VoteType } from "@/lib/proposals/types";
import { useT } from "@/lib/i18n";

export function ProposalRulesBody({
  resolutionRule,
  proposalType,
  voteType,
  backendRuleText,
  publicitySeconds,
  voteDurationSeconds,
}: {
  resolutionRule?: string;
  proposalType?: string;
  voteType?: VoteType;
  /** Extra rule key from vote_summary.resolution_rule */
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
  const normalizedVoteType = voteType ? normalizeVoteType(voteType) : undefined;
  const voteLabel =
    getVoteTypeLabel(normalizedVoteType) ??
    (normalizedVoteType ? VOTE_TYPES[normalizedVoteType].label : null);

  if (!meta) {
    return (
      <p className="text-sm text-muted-foreground">{t.proposals.rules.unavailable}</p>
    );
  }

  return (
    <div className="max-h-[min(70vh,32rem)] space-y-5 overflow-y-auto pr-1">
      {voteLabel && (
        <p className="text-sm">
          <span className="font-semibold">{t.proposals.create.selectVoteType}：</span>
          <span className="text-muted-foreground">{voteLabel}</span>
        </p>
      )}

      {meta.sections.map((section) => (
        <section key={section.title}>
          <h3 className="mb-2 text-sm font-semibold text-foreground">{section.title}</h3>
          <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {section.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/60" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
