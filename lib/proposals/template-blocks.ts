import { stripHtmlComments } from "./codec";
import type { MotivationBudgetItem, ProposalContentBlock } from "./types";

export type PreviewComponent = {
  name?: string;
  data?: Record<string, unknown>;
};

export type ProjectBudgetRow = {
  amount: string;
  asset: string;
  proportion: string;
  description: string;
};

export type ProjectBudgetSummary = {
  rows: ProjectBudgetRow[];
  asset: string;
  totalAmount: number;
  prepayRatio: number;
};

export type DisplayBlock =
  | { kind: "preview"; block: ProposalContentBlock; components: PreviewComponent[] }
  | {
      kind: "motivation";
      block: ProposalContentBlock;
      intro?: string;
      items: MotivationBudgetItem[];
      projectBudget?: ProjectBudgetSummary;
    }
  | { kind: "markdown"; block: ProposalContentBlock; markdown: string };

export function parsePreviewComponents(raw: string): PreviewComponent[] {
  const text = stripHtmlComments(raw).trim();
  if (!text.startsWith("[")) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? (parsed as PreviewComponent[]) : [];
  } catch {
    return [];
  }
}

/** True when a preview block has at least one subsection with data to show. */
export function hasPreviewContent(components: PreviewComponent[]): boolean {
  const byName = Object.fromEntries(components.filter((c) => c.name).map((c) => [c.name!, c]));
  const relate = byName.relate?.data;
  if (relate && (String(relate.relate ?? "").trim() || relate.proposal_id != null)) return true;
  const budgetList = (byName.budget?.data?.budgetList as unknown[] | undefined) ?? [];
  if (budgetList.length > 0) return true;
  if (String(byName.deliverables?.data?.description ?? "").trim()) return true;
  if (String(byName.deadline?.data?.description ?? "").trim()) return true;
  return false;
}

export function extractProjectBudget(blocks: ProposalContentBlock[]): ProjectBudgetSummary | undefined {
  for (const block of blocks) {
    if (block.type !== "preview") continue;
    const budget = parsePreviewComponents(block.content ?? "").find((c) => c.name === "budget");
    if (!budget?.data) continue;
    const list =
      (budget.data.budgetList as Array<{
        amount?: string;
        description?: string;
        proportion?: string;
        typeTest?: { name?: string };
      }>) ?? [];
    if (!list.length) continue;
    const rows = list.map((item) => ({
      amount: item.amount ?? "0",
      asset: item.typeTest?.name ?? "",
      proportion: item.proportion ?? "0",
      description: item.description ?? "",
    }));
    const asset = rows[0]?.asset ?? "";
    const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const prepayRatio = Math.max(...rows.map((row) => Number(row.proportion || 0)));
    return { rows, asset, totalAmount, prepayRatio };
  }
  return undefined;
}

function isMotivationPayloadBlock(block: ProposalContentBlock): boolean {
  return (
    block.component === "motivation" ||
    (block.type === "component" && Boolean(block.data?.budgetList?.length))
  );
}

function isRenderableMarkdownBlock(block: ProposalContentBlock): boolean {
  if (block.type === "preview" || block.type === "components") return false;
  if (isMotivationPayloadBlock(block)) return false;
  const title = block.title?.trim();
  const body = stripHtmlComments(block.content ?? "").trim();
  if (!title && !body) return false;
  if (title === "备注" && (body === "无" || !body)) return false;
  return true;
}

/** Turn API template blocks into renderable sections (preview / motivation / markdown). */
export function prepareDisplayBlocks(blocks: ProposalContentBlock[]): DisplayBlock[] {
  const motivationBlocks = blocks.filter(isMotivationPayloadBlock);
  const projectBudget = extractProjectBudget(blocks);
  const result: DisplayBlock[] = [];
  let motivationIdx = 0;

  for (const block of blocks) {
    if (isMotivationPayloadBlock(block)) continue;

    if (block.type === "preview") {
      const components = parsePreviewComponents(block.content ?? "");
      if (!hasPreviewContent(components)) continue;
      result.push({
        kind: "preview",
        block,
        components,
      });
      continue;
    }

    if (block.type === "components" && block.title === "激励申请表") {
      const payload = motivationBlocks[motivationIdx++];
      result.push({
        kind: "motivation",
        block,
        intro: block.content,
        items: payload?.data?.budgetList ?? [],
        projectBudget,
      });
      continue;
    }

    if (!isRenderableMarkdownBlock(block)) continue;

    result.push({
      kind: "markdown",
      block,
      markdown: stripHtmlComments(block.content ?? "").trim(),
    });
  }

  return result;
}

export function formatDeadline(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function sumMotivationAmount(items: MotivationBudgetItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function motivationAsset(items: MotivationBudgetItem[]): string {
  return items[0]?.assetInfo?.name ?? "";
}

/** Legacy OS budget summary displays SCR project budgets as WANG. */
export function formatBudgetSummaryAsset(asset: string): string {
  if (!asset || asset === "SCR") return "WANG";
  return asset;
}

export function collectMotivationWalletAddresses(blocks: ProposalContentBlock[]): string[] {
  const set = new Set<string>();
  for (const block of blocks) {
    if (block.component === "motivation" || block.type === "component") {
      for (const item of block.data?.budgetList ?? []) {
        if (item.address) set.add(item.address.toLowerCase());
      }
    }
  }
  return [...set];
}
