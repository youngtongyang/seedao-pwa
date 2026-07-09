import { normalizeProposalType, PROPOSAL_TYPES, typeLabel } from "./constants";
import type { ProposalType, VoteType } from "./types";
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

function hoursLabel(seconds: number | undefined, fallbackHours: number): string {
  const h = seconds ? Math.round(seconds / 3600) : fallbackHours;
  return `${h} 小时`;
}

function nodeConsensusSections(opts?: {
  special?: boolean;
  publicitySeconds?: number;
  voteDurationSeconds?: number;
}): RuleSection[] {
  const pub = hoursLabel(opts?.publicitySeconds, 96);
  const vote = hoursLabel(opts?.voteDurationSeconds, 48);
  const kind = opts?.special ? "特别提案" : "标准提案";

  return [
    {
      title: "提案性质",
      items: [
        `本规则适用于节点共识大会${kind}。`,
        "用于当季节点大会审议社区治理、规则修订及重要事项。",
      ],
    },
    {
      title: "发起资格",
      items: ["当季节点与市政厅成员可发起。", "提交前须完成背景、内容与备注填写。"],
    },
    {
      title: "公示与投票时限",
      items: [
        `提交并发布后进入公示期，默认 ${pub}（4 天）。`,
        `公示结束后自动进入投票期，默认 ${vote}（2 天）。`,
        "公示期内社区成员可阅读全文并发表评论。",
      ],
    },
    {
      title: "投票主体",
      items: ["投票主体为当季节点。", "每节点 1 票，按节点身份计票。"],
    },
    {
      title: "法定参与要求",
      items: [
        "实际参与投票的节点数须超过当季节点总数的一半（> 50%）。",
        "未达法定人数时，即使某选项领先，提案也不能视为通过。",
      ],
    },
    {
      title: "计票与生效",
      items: [
        "得票最多的选项为最终结果。",
        "若最高票选项出现并列，则本次投票无效，需重新发起。",
        "通过后由市政厅依授权执行；规则类提案按大会决议更新版本。",
      ],
    },
  ];
}

function townHallSections(opts?: {
  publicitySeconds?: number;
  voteDurationSeconds?: number;
}): RuleSection[] {
  const pub = hoursLabel(opts?.publicitySeconds, 72);
  const vote = hoursLabel(opts?.voteDurationSeconds, 48);

  return [
    {
      title: "提案性质",
      items: ["本规则适用于市政厅治理提案。", "用于市政厅履职、预算及社区日常治理事项。"],
    },
    {
      title: "发起资格",
      items: ["市政厅成员可发起。", "须说明背景、具体方案与执行安排。"],
    },
    {
      title: "公示与投票时限",
      items: [
        `提交并发布后进入公示期，默认 ${pub}（3 天）。`,
        `公示结束后进入投票期，默认 ${vote}（2 天）。`,
      ],
    },
    {
      title: "投票主体",
      items: ["投票主体为 SEEDAO 活跃成员。", "每位活跃成员 1 票。"],
    },
    {
      title: "法定参与要求",
      items: [
        "参与人数须达到元规则规定的 quorum（法定参与率）。",
        "未达 quorum 时提案不能生效。",
      ],
    },
    {
      title: "计票与生效",
      items: [
        "得票最多的选项为最终结果。",
        "若最高票选项出现并列，则本次投票无效。",
        "通过后由市政厅负责落地执行。",
      ],
    },
  ];
}

function tierSections(
  tier: "P1" | "P2" | "P3",
  phase: "立项" | "结项" | "特别",
  opts?: { publicitySeconds?: number; voteDurationSeconds?: number },
): RuleSection[] {
  const pub = hoursLabel(opts?.publicitySeconds, 72);
  const vote = hoursLabel(opts?.voteDurationSeconds, 48);
  const budgetHint =
    tier === "P1"
      ? "适用于较小规模的社区资源申请。"
      : tier === "P2"
        ? "适用于中等规模的社区项目。"
        : "适用于较大规模的社区项目与重要资源决策。";

  return [
    {
      title: "提案性质",
      items: [
        `本规则适用于 ${tier} 三层提案（${phase}）。`,
        budgetHint,
        "三层提案是元规则规定的社区公共资源使用机制之一。",
      ],
    },
    {
      title: "发起资格",
      items: [
        "具备相应身份与声望门槛的 SeeDAO 成员可发起。",
        phase === "结项" ? "结项提案须对应已立项并通过的原项目。" : "立项须说明背景、预算与执行计划。",
      ],
    },
    {
      title: "公示与投票时限",
      items: [
        `默认公示期 ${pub}，投票期 ${vote}。`,
        "公示期内社区成员可审阅方案并评论。",
      ],
    },
    {
      title: "投票主体",
      items: ["投票主体为符合元规则要求的 SeeDAO 活跃成员。", "具体门槛以当季治理手册为准。"],
    },
    {
      title: "法定参与要求",
      items: ["参与人数须达到该层级提案规定的 quorum。", "未达 quorum 时提案不能生效。"],
    },
    {
      title: "计票与生效",
      items: [
        "得票最多的选项为最终结果。",
        "若最高票选项并列，则本次投票无效。",
        phase === "结项" ? "结项通过后进入归档与资金结算流程。" : "立项通过后按预算拨付并进入执行阶段。",
      ],
    },
  ];
}

const RULE_BUILDERS: Record<
  string,
  (opts?: {
    special?: boolean;
    publicitySeconds?: number;
    voteDurationSeconds?: number;
  }) => ResolutionRuleMeta
> = {
  standard: (opts) => ({
    id: "standard",
    label: "节点共识大会规则提案",
    proposalType: "node_consensus_rule",
    sections: nodeConsensusSections(opts),
  }),
  node_consensus_standard: (opts) => ({
    id: "node_consensus_standard",
    label: "节点共识大会规则提案",
    proposalType: "node_consensus_rule",
    sections: nodeConsensusSections(opts),
  }),
  node_consensus_special: (opts) => ({
    id: "node_consensus_special",
    label: "节点共识大会特别提案",
    proposalType: "node_consensus_special",
    sections: nodeConsensusSections({ ...opts, special: true }),
  }),
  town_hall_standard: (opts) => ({
    id: "town_hall_standard",
    label: "市政厅联席会议常规提案",
    proposalType: "town_hall_meeting",
    sections: townHallSections(opts),
  }),
  p1_standard: (opts) => ({
    id: "p1_standard",
    label: "P1 提案立项",
    proposalType: "p1_project_init",
    sections: tierSections("P1", "立项", opts),
  }),
  p2_standard: (opts) => ({
    id: "p2_standard",
    label: "P2 提案",
    proposalType: "p2_project_init",
    sections: tierSections("P2", "立项", opts),
  }),
  p3_standard: (opts) => ({
    id: "p3_standard",
    label: "P3 提案",
    proposalType: "p3_project_init",
    sections: tierSections("P3", "立项", opts),
  }),
  p3_special: (opts) => ({
    id: "p3_special",
    label: "P3 特别提案",
    proposalType: "p3_special",
    sections: tierSections("P3", "特别", opts),
  }),
};
export function getResolutionRuleMeta(
  resolutionRule: string | undefined,
  proposalType?: string,
  opts?: {
    publicitySeconds?: number;
    voteDurationSeconds?: number;
  },
): ResolutionRuleMeta | null {
  const key = resolutionRule?.trim();
  if (key && RULE_BUILDERS[key]) {
    return RULE_BUILDERS[key](opts);
  }

  if (proposalType) {
    const normalizedType = normalizeProposalType(proposalType);
    if (normalizedType in PROPOSAL_TYPES) {
      const t = normalizedType as ProposalType;
      const meta = PROPOSAL_TYPES[t];
      const ruleKey = meta.resolutionRule;
      if (RULE_BUILDERS[ruleKey]) {
        const built = RULE_BUILDERS[ruleKey](opts);
        // P2/P3 结项沿用同层级规则，但文案按类型区分
        if (t === "p2_project_close") {
          return {
            ...built,
            label: "P2 提案结项",
            sections: tierSections("P2", "结项", opts),
          };
        }
        if (t === "p3_project_close") {
          return {
            ...built,
            label: "P3 提案结项",
            sections: tierSections("P3", "结项", opts),
          };
        }
        return { ...built, label: meta.label, proposalType: t };
      }
    }
  }
  if (key && (key.length > 40 || key.includes("。"))) {
    return {
      id: key,
      label: "投票规则",
      sections: [{ title: "规则说明", items: [key] }],
    };
  }

  if (proposalType) {
    const normalizedType = normalizeProposalType(proposalType);
    return {
      id: normalizedType,
      label: typeLabel(proposalType),      sections: [
        {
          title: "规则说明",
          items: ["暂无该类型的详细元规则文案，请参考 SeeDAO 元规则文档。"],
        },
      ],
    };
  }

  if (key) {
    return {
      id: key,
      label: key,
      sections: [{ title: "规则说明", items: [key] }],
    };
  }

  return null;
}

export function getVoteTypeLabel(voteType?: VoteType): string | null {
  if (voteType === 1) return "单选投票";
  if (voteType === 2) return "多选投票";
  return null;
}
