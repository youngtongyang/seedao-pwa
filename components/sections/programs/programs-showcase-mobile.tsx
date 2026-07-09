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

export function ProgramsShowcaseMobile() {
  const t = useT();
  const showcased = listPrograms().slice(0, SHOWCASE_LIMIT);

  return (
    <section id="programs" className="scroll-mt-16 px-5 py-14">
      <SectionHeading
        eyebrow={t.programs.eyebrow}
        title={t.programs.title}
        subtitle={t.programs.subtitle}
      />

      <Reveal className="mt-8">
        {/* 与会员权益一致的横向 snap 卡片：露出相邻卡片以提示可滑动 */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {showcased.map((program) => (
            <div key={program.slug} className="w-[85%] shrink-0 snap-center">
              <ProgramCard
                program={program}
                className="h-full"
                action={<BookmarkButton courseId={program.courseId} variant="icon" />}
              />
            </div>
          ))}
        </div>
      </Reveal>

      <div className="mt-4 text-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/program">
            {t.programs.viewAll}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
