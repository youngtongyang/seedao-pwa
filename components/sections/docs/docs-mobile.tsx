"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DocReader } from "./doc-reader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocalized, useT } from "@/lib/i18n";
import { docCategories, docTypeLabels, docs } from "@/lib/mock/docs";
import { cn } from "@/lib/utils";

export function DocsMobile() {
  const t = useT();
  const L = useLocalized();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = docs.find((d) => d.id === selectedId);

  return (
    <div className="px-5 py-8">
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key="reader"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
              {t.docs.backToList}
            </button>
            <DocReader doc={selected} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <Badge variant="secondary" className="mb-2">
              {t.docs.eyebrow}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{t.docs.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.docs.subtitle}</p>

            <div className="relative mt-6">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.docs.search}
                className="pl-10"
              />
            </div>

            <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
              <Chip
                active={categoryId === "all"}
                onClick={() => setCategoryId("all")}
                label={t.docs.allDocs}
              />
              {docCategories.map((c) => (
                <Chip
                  key={c.id}
                  active={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                  label={L(c.name)}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {t.docs.searchEmpty}
                </p>
              )}
              {filtered.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className="px-1.5 py-0">
                        {L(docTypeLabels[d.type])}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t.docs.readingTime(d.readingTime)}
                      </span>
                    </div>
                    <h3 className="font-semibold leading-snug">{L(d.title)}</h3>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {L(d.summary)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
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
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
