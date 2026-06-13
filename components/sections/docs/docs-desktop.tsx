"use client";

import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DocReader } from "./doc-reader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocalized, useT } from "@/lib/i18n";
import {
  docCategories,
  docTypeLabels,
  docs,
  type Doc,
} from "@/lib/mock/docs";
import { cn } from "@/lib/utils";

export function DocsDesktop() {
  const t = useT();
  const L = useLocalized();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string>(docs[0].id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      const inCat = categoryId === "all" || d.categoryId === categoryId;
      if (!inCat) return false;
      if (!q) return true;
      return [d.title, d.summary].some((v) =>
        `${v.zh} ${v.en}`.toLowerCase().includes(q),
      );
    });
  }, [query, categoryId]);

  const current: Doc | undefined =
    filtered.find((d) => d.id === selectedId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <Badge variant="secondary" className="mb-3">
          {t.docs.eyebrow}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">{t.docs.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {t.docs.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-[320px_1fr] gap-10">
        {/* Rail */}
        <aside className="sticky top-24 flex h-fit flex-col gap-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.docs.search}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryChip
              active={categoryId === "all"}
              onClick={() => setCategoryId("all")}
              label={t.docs.allDocs}
            />
            {docCategories.map((c) => (
              <CategoryChip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                label={L(c.name)}
              />
            ))}
          </div>

          <nav className="flex flex-col gap-1.5">
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-sm text-muted-foreground">
                {t.docs.searchEmpty}
              </p>
            )}
            {filtered.map((d) => {
              const active = current?.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                    active
                      ? "border-primary/40 bg-primary/5"
                      : "border-transparent hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="line-clamp-1 font-medium">
                      {L(d.title)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="px-1.5 py-0">
                      {L(docTypeLabels[d.type])}
                    </Badge>
                    {t.docs.readingTime(d.readingTime)}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Reader */}
        <div className="min-w-0">
          {current ? (
            <DocReader key={current.id} doc={current} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-muted-foreground">
              <BookOpen className="size-8" />
              <p>{t.docs.pickPrompt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
