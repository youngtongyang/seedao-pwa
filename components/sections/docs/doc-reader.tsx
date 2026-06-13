"use client";

import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import { useLocalized, useT } from "@/lib/i18n";
import { docTypeLabels, type Doc, type DocBlock } from "@/lib/mock/docs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const calloutStyles = {
  info: { icon: Info, cls: "border-primary/30 bg-primary/5 text-foreground" },
  tip: { icon: Lightbulb, cls: "border-success/30 bg-success/8 text-foreground" },
  warn: {
    icon: TriangleAlert,
    cls: "border-accent/40 bg-accent/10 text-foreground",
  },
} as const;

function Block({ block }: { block: DocBlock }) {
  const L = useLocalized();

  switch (block.kind) {
    case "heading":
      return (
        <h2 className="mt-8 text-xl font-bold tracking-tight first:mt-0">
          {L(block.text)}
        </h2>
      );
    case "paragraph":
      return (
        <p className="text-pretty leading-relaxed text-muted-foreground">
          {L(block.text)}
        </p>
      );
    case "list":
      return (
        <ul className="ml-1 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 leading-relaxed">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-muted-foreground">{L(item)}</span>
            </li>
          ))}
        </ul>
      );
    case "callout": {
      const style = calloutStyles[block.tone];
      return (
        <div
          className={cn(
            "flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
            style.cls,
          )}
        >
          <style.icon className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>{L(block.text)}</span>
        </div>
      );
    }
  }
}

export function DocReader({ doc }: { doc: Doc }) {
  const t = useT();
  const L = useLocalized();

  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <Badge variant="secondary" className="w-fit">
          {L(docTypeLabels[doc.type])}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {L(doc.title)}
        </h1>
        <p className="text-muted-foreground">{L(doc.summary)}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{t.docs.readingTime(doc.readingTime)}</span>
          <span>·</span>
          <span>{t.docs.updated(doc.updated)}</span>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {doc.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </article>
  );
}
