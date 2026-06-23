"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { fetchMemberCount } from "@/lib/stats/client";
import { cn } from "@/lib/utils";

/** Flat brand tints for the avatar cluster — restrained, no gradients. */
const AVATAR_TINTS = [
  "bg-brand-violet",
  "bg-brand-amber",
  "bg-brand-violet-soft",
  "bg-brand-amber-soft",
];

/** Deterministic grouping so SSR and client agree (no locale drift). */
function format(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Hero "active members" figure. Counts up to the live total reported by the
 * backend (which owns all the accounting) once it loads. The cluster of member
 * avatars turns a bare number into social proof — fitting for a community that's
 * "about relationships".
 */
export function MemberCount({ className }: { className?: string }) {
  const t = useT();
  const reduced = useReducedMotion();
  const [total, setTotal] = useState(0);

  // Pull the live total; setState only inside the async resolution (never
  // synchronously in an effect). Stays at 0 if the backend is unavailable.
  useEffect(() => {
    let active = true;
    fetchMemberCount().then((n) => {
      if (active && n != null) setTotal(n);
    });
    return () => {
      active = false;
    };
  }, []);

  const mv = useMotionValue(reduced ? total : 0);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    if (reduced) {
      mv.set(total);
      return;
    }
    const controls = animate(mv, total, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [total, reduced, mv]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-border bg-card/70 py-1.5 pl-2 pr-4 ring-hairline backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex -space-x-2.5" aria-hidden>
        {AVATAR_TINTS.map((tint, i) => (
          <span
            key={tint}
            className={cn("size-7 rounded-full ring-2 ring-card", tint)}
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>

      <p className="flex items-baseline gap-1.5">
        <motion.span className="text-xl font-bold tabular-nums tracking-tight">{text}</motion.span>
        <span className="text-sm text-muted-foreground">{t.hero.statMembers}</span>
      </p>

      <span className="relative ml-0.5 flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
    </div>
  );
}
