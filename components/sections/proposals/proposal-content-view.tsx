"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Read-only Vditor preview for proposal detail sections.
 * Falls back to plain text when content is empty.
 */
export function ProposalContentView({ markdown, className }: { markdown: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!markdown.trim()) {
      el.innerHTML = "";
      return;
    }

    let cancelled = false;

    void import("vditor").then(({ default: Vditor }) => {
      if (cancelled || !ref.current) return;
      void Vditor.preview(ref.current, markdown, {
        mode: resolvedTheme === "dark" ? "dark" : "light",
        cdn: "https://unpkg.com/vditor@3.11.2",
        theme: {
          current: resolvedTheme === "dark" ? "dark" : "light",
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [markdown, resolvedTheme]);

  if (!markdown.trim()) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "vditor-reset text-sm leading-relaxed [&_a]:text-primary [&_a]:underline",
        className,
      )}
    />
  );
}
