import type { ProposalContent, ProposalContentBlock } from "./types";

export type WireContentBlock = ProposalContentBlock;

export type WireContent = {
  blocks?: WireContentBlock[];
  plain_text?: string;
};

export type WireVoteOption = {
  label: string;
  value?: string;
  voter_count?: number;
};

const SECTION_KEYS: Record<string, keyof Pick<ProposalContent, "background" | "body" | "remarks">> = {
  背景: "background",
  内容: "body",
  备注: "remarks",
};

/** Encode a UTF-8 string as the backend's integer[] wire format. */
export function encodeText(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/** Decode integer[] wire bytes back to a UTF-8 string. */
export function decodeText(bytes: number[] | undefined | null): string {
  if (!bytes?.length) return "";
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Pack structured proposal sections into the content byte field. */
export function encodeProposalContent(content: ProposalContent): number[] {
  if (content.blocks?.length) {
    const wire: WireContent = { blocks: content.blocks };
    return encodeText(JSON.stringify(wire));
  }
  const { background, body, remarks, vote_type, vote_options } = content;
  return encodeText(JSON.stringify({ background, body, remarks, vote_type, vote_options }));
}

export function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, "").trim();
}

type WireComponent = {
  name?: string;
  data?: Record<string, unknown>;
};

function formatComponent(comp: WireComponent): string {
  const data = comp.data ?? {};
  switch (comp.name) {
    case "relate":
      return `**关联提案**：${String(data.relate ?? "")}`;
    case "budget": {
      const list =
        (data.budgetList as Array<{
          amount?: string;
          description?: string;
          typeTest?: { name?: string };
        }>) ?? [];
      if (!list.length) return "";
      const lines = list.map((item) => {
        const currency = item.typeTest?.name ?? "";
        const desc =
          item.description && item.description !== "无" ? `（${item.description}）` : "";
        return `- ${item.amount ?? "0"} ${currency}${desc}`;
      });
      return `**预算**\n\n${lines.join("\n")}`;
    }
    case "deliverables":
      return `**交付物**\n\n${String(data.description ?? "")}`;
    case "deadline":
      return `**截止时间**\n\n${String(data.description ?? "")}`;
    default:
      return "";
  }
}

/** Normalize a content block for read-only display (markdown or legacy form JSON). */
export function formatBlockContent(raw: string): string {
  const text = stripHtmlComments(raw).trim();
  if (!text) return "";
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => formatComponent(item as WireComponent)).filter(Boolean).join("\n\n");
      }
    } catch {
      /* fall through */
    }
  }
  return text;
}

function parseStructuredContent(parsed: Partial<ProposalContent> & WireContent): ProposalContent {
  return {
    background: parsed.background ?? "",
    body: parsed.body ?? "",
    remarks: parsed.remarks ?? "",
    blocks: parsed.blocks,
    vote_type: parsed.vote_type,
    vote_options: parsed.vote_options,
  };
}

function parseBlocksContent(wire: WireContent): ProposalContent {
  const blocks = wire.blocks ?? [];
  const result: ProposalContent = { background: "", body: "", remarks: "", blocks };
  for (const block of blocks) {
    const key = block.title ? SECTION_KEYS[block.title.trim()] : undefined;
    if (key) result[key] = block.content ?? "";
  }
  return result;
}

/** Parse proposal content from API object, byte[], or legacy JSON string. */
export function parseWireContent(raw: unknown): ProposalContent {
  const empty = { background: "", body: "", remarks: "" };
  if (raw == null) return empty;

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Partial<ProposalContent> & WireContent;
    if (obj.blocks?.length) {
      return parseBlocksContent(obj);
    }
    if ("background" in obj || "body" in obj || "remarks" in obj) {
      return parseStructuredContent(obj);
    }
  }

  if (Array.isArray(raw) && (raw.length === 0 || typeof raw[0] === "number")) {
    return decodeProposalContent(raw as number[]);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Partial<ProposalContent> & WireContent;
      if (parsed.blocks) return parseBlocksContent(parsed);
      return parseStructuredContent(parsed);
    } catch {
      return { background: "", body: raw, remarks: "" };
    }
  }

  return empty;
}

/** Unpack the content byte field into structured sections. */
export function decodeProposalContent(bytes: number[] | undefined | null): ProposalContent {
  const raw = decodeText(bytes);
  if (!raw) return { background: "", body: "", remarks: "" };
  try {
    const parsed = JSON.parse(raw) as Partial<ProposalContent> & WireContent;
    if (parsed.blocks) return parseBlocksContent(parsed);
    return parseStructuredContent(parsed);
  } catch {
    // Legacy or plain-text payloads — treat entire blob as body.
    return { background: "", body: raw, remarks: "" };
  }
}

/** Blocks worth rendering in the detail view. */
export function visibleContentBlocks(blocks: ProposalContentBlock[]): ProposalContentBlock[] {
  return blocks.filter((block) => {
    const title = block.title?.trim();
    const body = formatBlockContent(block.content ?? "");
    return Boolean(title || body);
  });
}

/** Encode vote option labels as a JSON string in integer[] form. */
export function encodeVoteOptions(options: string[]): number[] {
  return encodeText(JSON.stringify(options.filter(Boolean)));
}

/** Parse vote option labels from API objects, byte[], or string[]. */
export function parseWireVoteOptions(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0];
    if (typeof first === "object" && first !== null && "label" in first) {
      return (raw as WireVoteOption[]).map((o) => o.label).filter(Boolean);
    }
    if (typeof first === "number") return decodeVoteOptions(raw as number[]);
    if (typeof first === "string") return raw as string[];
  }
  return [];
}

/** Decode vote option labels from integer[] wire format. */
export function decodeVoteOptions(bytes: number[] | undefined | null): string[] {
  const raw = decodeText(bytes);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null) {
        return (parsed as WireVoteOption[]).map((o) => o.label).filter(Boolean);
      }
      return parsed.map(String);
    }
    return [];
  } catch {
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
  }
}
