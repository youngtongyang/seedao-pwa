"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocalized, useT } from "@/lib/i18n";
import { covenants } from "@/lib/mock/rules";
import { cn } from "@/lib/utils";

export function CovenantList() {
  const t = useT();
  const L = useLocalized();
  const [openId, setOpenId] = useState<string | null>(covenants[0]?.id ?? null);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {covenants.map((c, i) => {
        const open = openId === c.id;
        return (
          <div
            key={c.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card transition-colors",
              open ? "border-primary/40" : "border-border",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : c.id)}
              className="flex w-full items-center gap-4 p-5 text-left focus-visible:outline-none"
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                  open
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                <c.icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  {t.rules.principle} {String(i + 1).padStart(2, "0")}
                </span>
                <span className="block text-lg font-semibold">
                  {L(c.principle)}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="space-y-4 px-5 pb-5 pl-20">
                    <p className="text-pretty leading-relaxed text-muted-foreground">
                      {L(c.spirit)}
                    </p>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t.rules.inPractice}
                      </p>
                      <ul className="space-y-2">
                        {c.practice.map((p, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm">
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                              <Check className="size-3.5" />
                            </span>
                            {L(p)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Pledge */}
      <div className="mt-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
        <AnimatePresence mode="wait">
          {agreed ? (
            <motion.p
              key="agreed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-lg font-semibold text-primary"
            >
              <Sparkles className="size-5" />
              {t.rules.agreed}
            </motion.p>
          ) : (
            <motion.div
              key="pledge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-lg font-semibold">{t.rules.agreeTitle}</p>
              <Button onClick={() => setAgreed(true)} size="lg">
                <Check className="size-4" />
                {t.rules.agreeCta}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
