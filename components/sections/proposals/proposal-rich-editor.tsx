"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
};

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
  const containerId = useId().replace(/:/g, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{ getValue: () => string; setValue: (v: string) => void; destroy: () => void } | null>(null);
  const onChangeRef = useRef(onChange);
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);

  onChangeRef.current = onChange;

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
    </div>
  );
}
