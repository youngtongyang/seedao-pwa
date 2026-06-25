"use client";

import { useLocalized } from "@/lib/i18n";
import type { Benefit } from "@/lib/mock/membership";
import { cn } from "@/lib/utils";

export function BenefitItem({
  benefit,
  className,
}: {
  benefit: Benefit;
  className?: string;
}) {
  const L = useLocalized();
  return (
    <div
      className={cn(
        "group flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors duration-300 hover:border-foreground/25",
        className,
      )}
    >
      {/* Placeholder illustration — top three-quarters. */}
      <div className="flex flex-[3] items-center justify-center bg-muted/40">
        <benefit.icon className="size-12 text-primary/50" />
      </div>
      {/* Title + description — bottom quarter. */}
      <div className="flex flex-1 flex-col justify-center gap-1 p-5">
        <h3 className="font-semibold leading-snug">{L(benefit.title)}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {L(benefit.desc)}
        </p>
      </div>
    </div>
  );
}
