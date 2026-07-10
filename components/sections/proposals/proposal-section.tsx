import { cn } from "@/lib/utils";

/** Section block with the lavender header bar used across proposal pages. */
export function ProposalSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="border-b border-border bg-secondary/80 px-5 py-3">
        <h2 className="text-sm font-semibold text-secondary-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Simple markdown-ish renderer: paragraphs, headings, bold, lists. */
export function ProposalMarkdown({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="my-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {listItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h3 key={`h-${nodes.length}`} className="mb-2 mt-4 text-base font-bold first:mt-0">
          {trimmed.slice(3)}
        </h3>,
      );
      continue;
    }
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      flushList();
      nodes.push(
        <p key={`b-${nodes.length}`} className="my-2 text-sm font-semibold">
          {trimmed.slice(2, -2)}
        </p>,
      );
      continue;
    }
    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }
    flushList();
    nodes.push(
      <p key={`p-${nodes.length}`} className="my-2 text-sm leading-relaxed text-foreground/90">
        {trimmed}
      </p>,
    );
  }
  flushList();

  return <div className="prose-sm max-w-none">{nodes}</div>;
}
