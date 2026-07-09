/** Map backend English resolution_reason to Chinese display text. */

const REASON_ALIASES: Record<string, string> = {
  "participation must exceed half of quarter nodes":
    "参与投票的节点数须超过当季节点总数的一半，当前未达法定人数",
  "quarter_node_total not configured": "当季节点总数未配置，暂无法判定投票结果",
  "highest vote tie": "最高票选项出现并列，本次投票无效",
  "no valid votes": "未产生有效投票",
  "participation below quorum": "参与人数未达法定 quorum 要求",
  "participation below required rate": "参与率未达元规则要求",
};

const REASON_PATTERNS: Array<{ pattern: RegExp; text: string }> = [
  {
    pattern: /participation must exceed half of quarter nodes/i,
    text: "参与投票的节点数须超过当季节点总数的一半，当前未达法定人数",
  },
  {
    pattern: /quarter_node_total not configured/i,
    text: "当季节点总数未配置，暂无法判定投票结果",
  },
  {
    pattern: /participation.*below|below.*quorum/i,
    text: "参与人数未达法定要求",
  },
  {
    pattern: /tie|tied|并列/i,
    text: "最高票选项出现并列，本次投票无效",
  },
];

/** Format vote_summary.resolution_reason for UI (Chinese when possible). */
export function formatResolutionReason(reason: string | undefined | null): string {
  if (!reason) return "";
  const trimmed = reason.trim();
  if (!trimmed) return "";

  const alias = REASON_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  for (const { pattern, text } of REASON_PATTERNS) {
    if (pattern.test(trimmed)) return text;
  }

  // Already Chinese or unknown — show as-is.
  if (/[\u4e00-\u9fff]/.test(trimmed)) return trimmed;

  return trimmed;
}
