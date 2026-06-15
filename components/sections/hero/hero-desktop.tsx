"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { AmbientGlow } from "@/components/shared/ambient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalized, useT } from "@/lib/i18n";
import { heroStats } from "@/lib/mock/stats";
import { HeroVisual } from "./hero-visual";

export function HeroDesktop() {
  const t = useT();
  const L = useLocalized();
  const slogan = [t.hero.slogan1, t.hero.slogan2, t.hero.slogan3];

  return (
    <section className="relative isolate overflow-hidden">
      <AmbientGlow variant="hero" />
      <div className="absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="mx-auto grid min-h-[88vh] max-w-6xl grid-cols-2 items-center gap-12 px-6 py-20">
        <div className="flex flex-col items-start gap-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {t.hero.eyebrow}
            </Badge>
          </motion.div>

          <h1 className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-7xl font-black tracking-tight">
            {slogan.map((word, i) => (
              <motion.span
                key={word}
                className="text-gradient-brand"
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.15 }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="max-w-md whitespace-pre-line text-2xl font-semibold leading-snug text-foreground/90"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {t.hero.headline}
          </motion.p>

          <motion.p
            className="max-w-lg text-pretty text-base leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.62 }}
          >
            {t.hero.subhead}
          </motion.p>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.74 }}
          >
            <Button asChild size="lg">
              <Link href="/#membership">
                {t.hero.primaryCta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.dl
            className="mt-2 flex gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {heroStats.map((s) => (
              <div key={s.value} className="flex flex-col">
                <dt className="text-3xl font-bold tracking-tight">{s.value}</dt>
                <dd className="text-sm text-muted-foreground">{L(s.label)}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center"
        >
          <HeroVisual className="w-full max-w-md" />
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ChevronDown className="size-4 animate-bounce" />
          {t.hero.scrollHint}
        </span>
      </div>
    </section>
  );
}
