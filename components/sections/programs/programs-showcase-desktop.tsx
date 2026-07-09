"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { BookmarkButton } from "@/components/sections/program/bookmark-button";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { listPrograms } from "@/lib/mock/programs";
import { ProgramCard } from "./program-card";

/** 首页展示位最多露出的项目数，更多的引导去 /program 列表页 */
const SHOWCASE_LIMIT = 3;

export function ProgramsShowcaseDesktop() {
  const t = useT();

  return (
    <section id="programs" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow={t.programs.eyebrow}
          title={t.programs.title}
          subtitle={t.programs.subtitle}
          className="mb-12"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listPrograms().slice(0, SHOWCASE_LIMIT).map((program, i) => (
            <Reveal key={program.slug} delay={i * 0.08}>
              <ProgramCard
                program={program}
                className="h-full"
                action={<BookmarkButton courseId={program.courseId} variant="icon" />}
              />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center" delay={0.16}>
          <Button asChild variant="outline">
            <Link href="/program">
              {t.programs.viewAll}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
