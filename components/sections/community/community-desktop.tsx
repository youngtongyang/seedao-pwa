"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useLocalized, useT } from "@/lib/i18n";
import { communityFacets } from "@/lib/mock/community";
import { cn } from "@/lib/utils";

const ITEM_H = 64; // px per name row in the right-hand wheel
const VH_PER_CARD = 90; // scroll distance allotted to each card

const accentText = {
  violet: "text-primary",
  amber: "text-accent-foreground",
} as const;
const accentBubble = {
  violet: "bg-primary/10 text-primary",
  amber: "bg-accent/20 text-accent-foreground",
} as const;
const accentBar = { violet: "bg-primary", amber: "bg-accent" } as const;

export function CommunityDesktop() {
  const t = useT();
  const L = useLocalized();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const n = communityFacets.length;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
    setActive(idx);
  });

  function goTo(i: number) {
    const el = sectionRef.current;
    if (!el) return;
    const elTop = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const p = (i + 0.5) / n;
    window.scrollTo({ top: elTop + p * range, behavior: "smooth" });
  }

  const facet = communityFacets[active];

  return (
    <section
      ref={sectionRef}
      id="community"
      className="relative"
      style={{ height: `${n * VH_PER_CARD}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <Badge variant="secondary" className="px-3 py-1">
              {t.community.eyebrow}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.community.title}
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              {t.community.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-[1fr_320px] items-center gap-16">
            {/* Left — details of the active card */}
            <div className="min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={facet.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-5"
                >
                  <span
                    className={cn(
                      "flex size-16 items-center justify-center rounded-2xl",
                      accentBubble[facet.accent],
                    )}
                  >
                    <facet.icon className="size-8" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {L(facet.tagline)}
                    </p>
                    <h3 className="mt-1 text-5xl font-black tracking-tight">
                      {L(facet.title)}
                    </h3>
                  </div>
                  <p className="max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                    {L(facet.detail)}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right — scrollable name wheel */}
            <div
              className="relative select-none"
              style={{ height: ITEM_H * 5 }}
              aria-hidden
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-background to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-background to-transparent" />
              <motion.ul
                className="absolute right-0 top-1/2"
                animate={{ y: -(active * ITEM_H + ITEM_H / 2) }}
                transition={{ type: "spring", stiffness: 260, damping: 32 }}
              >
                {communityFacets.map((f, i) => {
                  const d = Math.abs(i - active);
                  const isActive = i === active;
                  const opacity = isActive ? 1 : d === 1 ? 0.45 : d === 2 ? 0.2 : 0.08;
                  return (
                    <li
                      key={f.id}
                      style={{ height: ITEM_H }}
                      className="flex items-center justify-end"
                    >
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-hidden={false}
                        className="pointer-events-auto flex items-center justify-end gap-3 text-right transition-all"
                        style={{
                          opacity,
                          transform: `scale(${isActive ? 1 : 0.85})`,
                        }}
                      >
                        <span
                          className={cn(
                            "text-2xl font-bold tracking-tight transition-colors",
                            isActive
                              ? accentText[f.accent]
                              : "text-foreground",
                          )}
                        >
                          {L(f.title)}
                        </span>
                        {isActive && (
                          <span
                            className={cn(
                              "h-7 w-1 rounded-full",
                              accentBar[f.accent],
                            )}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ChevronDown className="size-4 animate-bounce" />
            {t.community.scrollHint}
          </div>
        </div>
      </div>
    </section>
  );
}
