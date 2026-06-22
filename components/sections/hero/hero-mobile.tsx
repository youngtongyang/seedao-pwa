"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AmbientGlow } from "@/components/shared/ambient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { MemberCount } from "./member-count";

// Client-only (lottie-web touches `document`); placeholder holds layout.
const HeroLottie = dynamic(() => import("./hero-lottie"), {
  ssr: false,
  loading: () => <div className="aspect-square w-full" />,
});

export function HeroMobile() {
  const t = useT();
  const slogan = [t.hero.slogan1, t.hero.slogan2, t.hero.slogan3];

  return (
    <section className="relative isolate overflow-hidden px-5 pb-12 pt-8">
      <AmbientGlow variant="hero" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-6 w-52"
      >
        <HeroLottie />
      </motion.div>

      <div className="flex flex-col items-center text-center">
        <Badge variant="secondary" className="px-3 py-1">
          {t.hero.eyebrow}
        </Badge>

        <h1 className="mt-4 flex items-baseline justify-center gap-x-3 text-5xl font-black tracking-tight">
          {slogan.map((word, i) => (
            <motion.span
              key={word}
              className="text-gradient-brand"
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <p className="mt-4 whitespace-pre-line text-lg font-semibold leading-snug">
          {t.hero.headline}
        </p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
          {t.hero.subhead}
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/#membership">
              {t.hero.primaryCta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex justify-center">
          <MemberCount />
        </div>
      </div>
    </section>
  );
}
