"use client";

import { motion, type PanInfo } from "framer-motion";
import { useState } from "react";
import { SectionHeading } from "@/components/shared/section-heading";
import { useLocalized, useT } from "@/lib/i18n";
import { communityFacets } from "@/lib/mock/community";
import { cn } from "@/lib/utils";

const accentBubble = {
  violet: "bg-primary/10 text-primary",
  amber: "bg-accent/20 text-accent-foreground",
} as const;

const SWIPE = 70; // px threshold to change cards

export function CommunityMobile() {
  const t = useT();
  const L = useLocalized();
  const [index, setIndex] = useState(0);
  const n = communityFacets.length;

  function onDragEnd(_: unknown, info: PanInfo) {
    const dx = info.offset.x;
    if (dx < -SWIPE && index < n - 1) setIndex((i) => i + 1);
    else if (dx > SWIPE && index > 0) setIndex((i) => i - 1);
  }

  return (
    <section id="community" className="px-5 py-14">
      <SectionHeading
        eyebrow={t.community.eyebrow}
        title={t.community.title}
        subtitle={t.community.subtitle}
      />

      {/* Stacked deck */}
      <div className="relative mt-8 h-[400px]">
        {communityFacets.map((facet, i) => {
          const pos = i - index;
          const isFront = pos === 0;

          // Behind cards peek; swiped-away cards fly out left.
          const target =
            pos < 0
              ? { x: -340, y: 0, scale: 0.9, opacity: 0 }
              : pos === 0
                ? { x: 0, y: 0, scale: 1, opacity: 1 }
                : pos === 1
                  ? { x: 0, y: 18, scale: 0.94, opacity: 0.65 }
                  : pos === 2
                    ? { x: 0, y: 36, scale: 0.88, opacity: 0.32 }
                    : { x: 0, y: 48, scale: 0.85, opacity: 0 };

          return (
            <motion.article
              key={facet.id}
              className={cn(
                "absolute inset-0 flex flex-col gap-4 rounded-3xl border border-border bg-card p-6",
                isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
              )}
              style={{ zIndex: n - Math.abs(pos) }}
              animate={target}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              drag={isFront ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              dragSnapToOrigin
              onDragEnd={isFront ? onDragEnd : undefined}
            >
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl",
                  accentBubble[facet.accent],
                )}
              >
                <facet.icon className="size-7" />
              </span>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {L(facet.tagline)}
                </p>
                <h3 className="mt-1 text-4xl font-black tracking-tight">
                  {L(facet.title)}
                </h3>
              </div>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {L(facet.detail)}
              </p>
            </motion.article>
          );
        })}
      </div>

      {/* Dots + swipe hint */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {communityFacets.map((f, i) => (
            <button
              key={f.id}
              type="button"
              aria-label={L(f.title)}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t.community.swipeHint}</p>
      </div>
    </section>
  );
}
