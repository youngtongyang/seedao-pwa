import { normalizeProposalType, PROPOSAL_TYPES } from "./constants";
import type { Messages } from "@/lib/i18n/messages";
import type { ProposalType, VoteType } from "./types";

export type RulesCopy = Messages["proposals"]["rulesCopy"];

export type RuleSection = {
  title: string;
  items: string[];
};

export type ResolutionRuleMeta = {
  id: string;
  label: string;
  proposalType?: ProposalType;
  sections: RuleSection[];
};

type RuleOpts = {
  special?: boolean;
  publicitySeconds?: number;
  voteDurationSeconds?: number;
};

type TierPhase = "init" | "close" | "special";

function hoursLabel(
  copy: RulesCopy,
  seconds: number | undefined,
  fallbackHours: number,
): string {
  const h = seconds ? Math.round(seconds / 3600) : fallbackHours;
  return copy.hourUnit.replace("{h}", String(h));
}

function fillTiming(template: string, pub: string, vote: string, pubDays?: string, voteDays?: string): string {
  return template
    .replace("{pubHours}", pub)
    .replace("{voteHours}", vote)
    .replace("{pubDays}", pubDays ?? "")
    .replace("{voteDays}", voteDays ?? "");
}

function nodeAssemblySections(copy: RulesCopy, opts?: RuleOpts): RuleSection[] {
  const pub = hoursLabel(copy, opts?.publicitySeconds, 96);
  const vote = hoursLabel(copy, opts?.voteDurationSeconds, 48);
  const c = copy.nodeAssembly;
  const t = copy.sectionTitles;

  return [
    { title: t.nature, items: [...c.nature] },
    { title: t.eligibility, items: [...c.eligibility] },
    {
      title: t.timing,
      items: [
        fillTiming(c.timing[0], pub, vote, c.pubDays, c.voteDays),
        fillTiming(c.timing[1], pub, vote, c.pubDays, c.voteDays),
        c.timing[2],
      ],
    },
    { title: t.voters, items: [...c.voters] },
    { title: t.quorum, items: [...c.quorum] },
    { title: t.tally, items: [...c.tally] },
  ];
}

function nodeMetaRuleSections(copy: RulesCopy, opts?: RuleOpts): RuleSection[] {
  const pub = hoursLabel(copy, opts?.publicitySeconds, 96);
  const vote = hoursLabel(copy, opts?.voteDurationSeconds, 48);
  const c = copy.nodeMetaRule;
  const t = copy.sectionTitles;

  return [
    { title: t.nature, items: [...c.nature] },
    { title: t.eligibility, items: [...c.eligibility] },
    {
      title: t.timing,
      items: [
        fillTiming(c.timing[0], pub, vote, c.pubDays, c.voteDays),
        fillTiming(c.timing[1], pub, vote, c.pubDays, c.voteDays),
        c.timing[2],
      ],
    },
    { title: t.voters, items: [...c.voters] },
    { title: t.quorum, items: [...c.quorum] },
    { title: t.tally, items: [...c.tally] },
  ];
}

function townHallSections(copy: RulesCopy, opts?: RuleOpts): RuleSection[] {
  const pub = hoursLabel(copy, opts?.publicitySeconds, 72);
  const vote = hoursLabel(copy, opts?.voteDurationSeconds, 48);
  const c = copy.townHall;
  const t = copy.sectionTitles;

  return [
    { title: t.nature, items: [...c.nature] },
    { title: t.eligibility, items: [...c.eligibility] },
    {
      title: t.timing,
      items: [
        fillTiming(c.timing[0], pub, vote, c.pubDays, c.voteDays),
        fillTiming(c.timing[1], pub, vote, c.pubDays, c.voteDays),
      ],
    },
    { title: t.voters, items: [...c.voters] },
    { title: t.quorum, items: [...c.quorum] },
    { title: t.tally, items: [...c.tally] },
  ];
}

function tierScaleHint(copy: RulesCopy, tier: "P1" | "P2" | "P3"): string {
  if (tier === "P1") return copy.tier.scaleSmall;
  if (tier === "P2") return copy.tier.scaleMedium;
  return copy.tier.scaleLarge;
}

function tierNatureLine(copy: RulesCopy, tier: "P1" | "P2" | "P3", phase: TierPhase): string {
  const key =
    phase === "close" ? copy.tier.natureClose : phase === "special" ? copy.tier.natureSpecial : copy.tier.natureInit;
  return key.replace("{tier}", tier);
}

function tierSections(
  copy: RulesCopy,
  tier: "P1" | "P2" | "P3",
  phase: TierPhase,
  opts?: RuleOpts,
): RuleSection[] {
  const pub = hoursLabel(copy, opts?.publicitySeconds, 72);
  const vote = hoursLabel(copy, opts?.voteDurationSeconds, 48);
  const c = copy.tier;
  const t = copy.sectionTitles;
  const tally =
    phase === "close" ? c.tallyClose : phase === "special" ? c.tallySpecial : c.tallyInit;

  return [
    {
      title: t.nature,
      items: [tierNatureLine(copy, tier, phase), tierScaleHint(copy, tier), c.mechanism],
    },
    {
      title: t.eligibility,
      items: [
        c.eligibilityInit,
        phase === "close" ? c.eligibilityClose : c.eligibilityPlan,
      ],
    },
    {
      title: t.timing,
      items: c.timing.map((line) => fillTiming(line, pub, vote)),
    },
    { title: t.voters, items: [...c.voters] },
    { title: t.quorum, items: [...c.quorum] },
    { title: t.tally, items: [...tally] },
  ];
}

function buildRuleMeta(
  copy: RulesCopy,
  id: string,
  label: string,
  proposalType: ProposalType,
  sections: RuleSection[],
): ResolutionRuleMeta {
  return { id, label, proposalType, sections };
}

function ruleBuilders(
  copy: RulesCopy,
  typeLabels: Messages["proposals"]["types"],
): Record<string, (opts?: RuleOpts) => ResolutionRuleMeta> {
  return {
    standard: (opts) =>
      buildRuleMeta(
        copy,
        "standard",
        typeLabels.node_consensus_rule,
        "node_consensus_rule",
        nodeMetaRuleSections(copy, opts),
      ),
    node_meta_rule: (opts) =>
      buildRuleMeta(
        copy,
        "node_meta_rule",
        typeLabels.node_consensus_rule,
        "node_consensus_rule",
        nodeMetaRuleSections(copy, opts),
      ),
    node_consensus_standard: (opts) =>
      buildRuleMeta(
        copy,
        "node_consensus_standard",
        typeLabels.node_consensus_special,
        "node_consensus_special",
        nodeAssemblySections(copy, opts),
      ),
    node_assembly: (opts) =>
      buildRuleMeta(
        copy,
        "node_assembly",
        typeLabels.node_consensus_special,
        "node_consensus_special",
        nodeAssemblySections(copy, opts),
      ),
    node_consensus_special: (opts) =>
      buildRuleMeta(
        copy,
        "node_consensus_special",
        typeLabels.node_consensus_special,
        "node_consensus_special",
        nodeAssemblySections(copy, opts),
      ),
    town_hall_standard: (opts) =>
      buildRuleMeta(
        copy,
        "town_hall_standard",
        typeLabels.town_hall_meeting,
        "town_hall_meeting",
        townHallSections(copy, opts),
      ),
    p1_standard: (opts) =>
      buildRuleMeta(
        copy,
        "p1_standard",
        typeLabels.p1_project_init,
        "p1_project_init",
        tierSections(copy, "P1", "init", opts),
      ),
    p2_standard: (opts) =>
      buildRuleMeta(
        copy,
        "p2_standard",
        typeLabels.p2_project_init,
        "p2_project_init",
        tierSections(copy, "P2", "init", opts),
      ),
    p3_standard: (opts) =>
      buildRuleMeta(
        copy,
        "p3_standard",
        typeLabels.p3_project_init,
        "p3_project_init",
        tierSections(copy, "P3", "init", opts),
      ),
    p3_special: (opts) =>
      buildRuleMeta(
        copy,
        "p3_special",
        typeLabels.p3_special,
        "p3_special",
        tierSections(copy, "P3", "special", opts),
      ),
  };
}

export function getResolutionRuleMeta(
  copy: RulesCopy,
  typeLabels: Messages["proposals"]["types"],
  resolutionRule: string | undefined,
  proposalType?: string,
  opts?: {
    publicitySeconds?: number;
    voteDurationSeconds?: number;
  },
): ResolutionRuleMeta | null {
  const builders = ruleBuilders(copy, typeLabels);
  const key = resolutionRule?.trim();

  if (key && builders[key]) {
    return builders[key](opts);
  }

  if (proposalType) {
    const normalizedType = normalizeProposalType(proposalType);
    if (normalizedType in PROPOSAL_TYPES) {
      const t = normalizedType as ProposalType;
      const meta = PROPOSAL_TYPES[t];
      const ruleKey = meta.resolutionRule;
      if (builders[ruleKey]) {
        const built = builders[ruleKey](opts);
        if (t === "p2_project_close") {
          return {
            ...built,
            label: typeLabels.p2_project_close,
            sections: tierSections(copy, "P2", "close", opts),
          };
        }
        if (t === "p3_project_close") {
          return {
            ...built,
            label: typeLabels.p3_project_close,
            sections: tierSections(copy, "P3", "close", opts),
          };
        }
        return { ...built, label: typeLabels[t], proposalType: t };
      }
    }
  }

  if (key && (key.length > 40 || key.includes("。"))) {
    return {
      id: key,
      label: copy.fallbackTitle,
      sections: [{ title: copy.sectionTitles.fallback, items: [key] }],
    };
  }

  if (proposalType) {
    const normalizedType = normalizeProposalType(proposalType);
    const label = typeLabels[normalizedType as ProposalType] ?? proposalType;
    return {
      id: normalizedType,
      label,
      sections: [{ title: copy.sectionTitles.fallback, items: [copy.fallbackHint] }],
    };
  }

  if (key) {
    return {
      id: key,
      label: key,
      sections: [{ title: copy.sectionTitles.fallback, items: [key] }],
    };
  }

  return null;
}

export function getVoteTypeLabel(
  voteTypes: Messages["proposals"]["voteTypes"],
  voteType?: VoteType,
): string | null {
  if (voteType === 1) return voteTypes.single;
  if (voteType === 2) return voteTypes.multi;
  return null;
}
