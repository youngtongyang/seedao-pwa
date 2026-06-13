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
    <div className={cn("flex gap-3.5", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <benefit.icon className="size-5" />
      </span>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold leading-snug">{L(benefit.title)}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {L(benefit.desc)}
        </p>
      </div>
    </div>
  );
}
