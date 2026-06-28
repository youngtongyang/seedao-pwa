"use client";

import { ArrowBigRightDash } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { benefits } from "@/lib/mock/membership";
import { cn } from "@/lib/utils";
import { BenefitItem } from "./benefit-item";

const COPIES = 3;
const STEP = 256 + 20; // one card (w-64) + gap-5, in px

// Three back-to-back copies of the list make the rail scroll right forever: a
// click rewinds by exactly one copy before animating whenever the next step
// would leave the middle copy, so the loop never hits an edge and the seam is
// invisible (every copy is identical).
const loop = Array.from({ length: COPIES }, (_, c) =>
  benefits.map((b) => ({ ...b, key: `${b.id}-${c}` })),
).flat();

/**
 * The membership benefits as an infinite, right-scrolling card rail. Shared by
 * the home membership section and the desktop login page so both show the same
 * feature-card display. Height comes from the parent — pass `h-*` via
 * `className` where there's no stretching context (e.g. the login column).
 */
export function BenefitRail({ className }: { className?: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  // Fade cards by horizontal position — dim on the left, full strength on the
  // right — so the rightmost visible card always reads as the "current" one.
  const paint = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const width = rail.clientWidth;
    for (const child of Array.from(rail.children) as HTMLElement[]) {
      const center = child.offsetLeft + child.offsetWidth / 2 - rail.scrollLeft;
      const t = Math.min(Math.max(center / width, 0), 1);
      child.style.opacity = String(0.15 + t * 0.85);
    }
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollLeft = rail.scrollWidth / COPIES; // start inside the middle copy
    paint();
  }, [paint]);

  const next = () => {
    const rail = railRef.current;
    if (!rail) return;
    const setW = rail.scrollWidth / COPIES;
    if (rail.scrollLeft + STEP >= setW * (COPIES - 1)) rail.scrollLeft -= setW;
    rail.scrollBy({ left: STEP, behavior: "smooth" });
  };

  return (
    <div className={cn("relative h-full", className)}>
      <div
        ref={railRef}
        onScroll={onScroll}
        className="flex h-full gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loop.map((b) => (
          <BenefitItem key={b.key} benefit={b} />
        ))}
      </div>

      {/* Right-only control — drives the infinite forward scroll. */}
      <button
        type="button"
        onClick={next}
        aria-label="Scroll to next benefit"
        className="absolute right-0 top-1/2 flex size-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:border-foreground/25"
      >
        <ArrowBigRightDash className="size-5" />
      </button>
    </div>
  );
}
