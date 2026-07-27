"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Read-only Vditor preview for proposal detail sections.
 * Loads Vditor CSS locally (same as the editor) so headings / lists / hr
 * keep hierarchy even when the CDN theme stylesheet is slow or blocked.
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

    void Promise.all([import("vditor"), import("vditor/dist/index.css")]).then(
      ([{ default: Vditor }]) => {
        if (cancelled || !ref.current) return;
        void Vditor.preview(ref.current, markdown, {
          mode: resolvedTheme === "dark" ? "dark" : "light",
          cdn: "https://unpkg.com/vditor@3.11.2",
          theme: {
            current: resolvedTheme === "dark" ? "dark" : "light",
          },
        });
      },
    );

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
        "vditor-reset text-sm leading-relaxed text-foreground/90",
        // Local typography fallback — do not rely solely on Vditor CDN theme CSS
        "[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:first:mt-0",
        "[&_h2]:mb-2.5 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:first:mt-0",
        "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:first:mt-0",
        "[&_h4]:mb-1.5 [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:first:mt-0",
        "[&_p]:my-2.5 [&_p]:leading-relaxed",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
        "[&_li]:leading-relaxed",
        "[&_hr]:my-5 [&_hr]:border-border",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-3",
        "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium",
        "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
        className,
      )}
    />
  );
}
