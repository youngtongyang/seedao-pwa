"use client";

import { Loader2, Table2, Columns3, Rows3, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
};

type TableAction = "addRow" | "addCol" | "delRow" | "delCol";

type VditorLike = {
  getValue: () => string;
  setValue: (v: string) => void;
  destroy: () => void;
  focus: () => void;
};

type MdTable = {
  startLine: number;
  endLine: number;
  header: string[];
  sep: string[];
  body: string[][];
};

function isPipeRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.includes("|", 1);
}

function isSepRow(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|")) return false;
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(t);
}

function splitCells(line: string): string[] {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map((c) => c.trim());
}

function joinCells(cells: string[]): string {
  return `| ${cells.map((c) => (c === "" ? " " : c)).join(" | ")} |`;
}

function parseTables(lines: string[]): MdTable[] {
  const tables: MdTable[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isPipeRow(lines[i]) && i + 1 < lines.length && isSepRow(lines[i + 1])) {
      const startLine = i;
      const header = splitCells(lines[i]);
      const sep = splitCells(lines[i + 1]);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && isPipeRow(lines[i]) && !isSepRow(lines[i])) {
        body.push(splitCells(lines[i]));
        i += 1;
      }
      tables.push({ startLine, endLine: i, header, sep, body });
      continue;
    }
    i += 1;
  }
  return tables;
}

function serializeTable(table: MdTable): string[] {
  const colCount = Math.max(
    table.header.length,
    table.sep.length,
    ...table.body.map((r) => r.length),
    1,
  );
  const pad = (cells: string[], fill = " ") => {
    const next = cells.slice(0, colCount);
    while (next.length < colCount) next.push(fill);
    return next;
  };
  const sep = pad(
    table.sep.map((c) => (/:-+:?|:?-+:?/.test(c) ? c : "---")),
    "---",
  );
  return [
    joinCells(pad(table.header)),
    joinCells(sep),
    ...table.body.map((row) => joinCells(pad(row))),
  ];
}

function mutateTable(table: MdTable, action: TableAction): MdTable | null {
  const cols = Math.max(table.header.length, 1);
  if (action === "addRow") {
    return {
      ...table,
      body: [...table.body, Array.from({ length: cols }, () => " ")],
    };
  }
  if (action === "addCol") {
    return {
      ...table,
      header: [...table.header, `col${cols + 1}`],
      sep: [...table.sep, "---"],
      body: table.body.map((row) => [...row, " "]),
    };
  }
  if (action === "delRow") {
    if (table.body.length === 0) return null;
    return { ...table, body: table.body.slice(0, -1) };
  }
  if (action === "delCol") {
    if (cols <= 1) return null;
    return {
      ...table,
      header: table.header.slice(0, -1),
      sep: table.sep.slice(0, -1),
      body: table.body.map((row) => row.slice(0, -1)),
    };
  }
  return null;
}

function applyTableAction(markdown: string, tableIndex: number, action: TableAction): string | null {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const tables = parseTables(lines);
  if (!tables.length) return null;
  const idx = Math.min(Math.max(tableIndex, 0), tables.length - 1);
  const target = tables[idx];
  const nextTable = mutateTable(target, action);
  if (!nextTable) return null;
  const nextLines = [
    ...lines.slice(0, target.startLine),
    ...serializeTable(nextTable),
    ...lines.slice(target.endLine),
  ];
  return nextLines.join("\n");
}

function tableIndexFromCell(ir: Element, cell: Element): number {
  const table = cell.closest("table");
  if (!table) return 0;
  const tables = Array.from(ir.querySelectorAll("table"));
  const i = tables.indexOf(table as HTMLTableElement);
  return i >= 0 ? i : 0;
}

/**
 * Lazy-loaded Vditor IR editor for proposal fields.
 * Matches the legacy SeeDAO proposal editor toolbar (bold, lists, links, etc.).
 */
export function ProposalRichEditor({
  value,
  onChange,
  placeholder,
  minHeight = 280,
  className,
}: Props) {
  const t = useT();
  const containerId = useId().replace(/:/g, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<VditorLike | null>(null);
  const onChangeRef = useRef(onChange);
  const lastCellRef = useRef<HTMLTableCellElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      const [{ default: Vditor }] = await Promise.all([
        import("vditor"),
        import("vditor/dist/index.css"),
      ]);

      if (cancelled || !hostRef.current) return;

      const vditor = new Vditor(containerId, {
        height: minHeight,
        mode: "ir",
        placeholder: placeholder ?? "",
        theme: resolvedTheme === "dark" ? "dark" : "classic",
        counter: { enable: true, type: "text" },
        toolbar: [
          "headings",
          "bold",
          "italic",
          "strike",
          "|",
          "line",
          "quote",
          "list",
          "ordered-list",
          "check",
          "|",
          "code",
          "inline-code",
          "link",
          "table",
          "|",
          "undo",
          "redo",
        ],
        cache: { enable: false },
        after: () => {
          if (cancelled) return;
          vditor.setValue(value);
          setReady(true);
        },
        input: (v) => onChangeRef.current(v),
      });

      editorRef.current = vditor;
    }

    void mount();

    return () => {
      cancelled = true;
      editorRef.current?.destroy();
      editorRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per container id
  }, [containerId, minHeight]);

  // Remember last clicked table cell so toolbar buttons know which table to edit.
  useEffect(() => {
    if (!ready) return;
    const ir = document.getElementById(containerId)?.querySelector(".vditor-ir");
    if (!ir) return;
    const onPointer = (event: Event) => {
      const cell = (event.target as HTMLElement | null)?.closest?.("td,th") as
        | HTMLTableCellElement
        | null;
      if (cell && ir.contains(cell)) lastCellRef.current = cell;
    };
    ir.addEventListener("pointerup", onPointer);
    return () => ir.removeEventListener("pointerup", onPointer);
  }, [ready, containerId]);

  // Sync external value (e.g. loading a draft) without remounting.
  useEffect(() => {
    if (!ready || !editorRef.current) return;
    const current = editorRef.current.getValue();
    if (current !== value) editorRef.current.setValue(value);
  }, [value, ready]);

  useEffect(() => {
    if (!ready || !editorRef.current) return;
    // Vditor theme switch requires destroy/remount — keep editor readable in both modes via CSS.
  }, [resolvedTheme, ready]);

  function onTableAction(action: TableAction) {
    const editor = editorRef.current;
    if (!editor) return;
    const ir = document.getElementById(containerId)?.querySelector(".vditor-ir");
    const cell = lastCellRef.current;
    const tableIndex =
      ir && cell && ir.contains(cell) ? tableIndexFromCell(ir, cell) : 0;
    const current = editor.getValue();
    const next = applyTableAction(current, tableIndex, action);
    if (next == null || next === current) return;
    editor.setValue(next);
    onChangeRef.current(next);
  }

  const tableActions: { action: TableAction; label: string; icon: ReactNode }[] = [
    {
      action: "addRow",
      label: t.proposals.form.tableAddRow,
      icon: <Rows3 className="size-3.5" />,
    },
    {
      action: "addCol",
      label: t.proposals.form.tableAddCol,
      icon: <Columns3 className="size-3.5" />,
    },
    {
      action: "delRow",
      label: t.proposals.form.tableDelRow,
      icon: <Trash2 className="size-3.5" />,
    },
    {
      action: "delCol",
      label: t.proposals.form.tableDelCol,
      icon: <Table2 className="size-3.5" />,
    },
  ];

  return (
    <div className={cn("relative", className)}>
      {!ready && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-muted/30"
          style={{ minHeight }}
        >
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}
      <div ref={hostRef} id={containerId} className="vditor-seedao rounded-xl overflow-hidden" />
      <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{t.proposals.form.tableHint}</p>
        <div className="flex flex-wrap gap-1.5">
          {tableActions.map((item) => (
            <button
              key={item.action}
              type="button"
              disabled={!ready}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onTableAction(item.action)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5",
                "text-xs font-medium text-foreground transition-colors",
                "hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
