"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AmbientGlow } from "@/components/shared/ambient";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ClosingCTA({ className }: { className?: string }) {
  const t = useT();

  return (
    <section className={cn("px-5 py-20 sm:px-6", className)}>
      <Reveal className="relative isolate mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center">
        <AmbientGlow variant="soft" />
        <p className="text-gradient-brand text-3xl font-black tracking-tight sm:text-4xl">
          {t.footer.slogan}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
          {t.hero.subhead}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/#membership">
              {t.hero.primaryCta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
