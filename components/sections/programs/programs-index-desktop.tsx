"use client";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { BookmarkButton } from "@/components/sections/program/bookmark-button";
import { useT } from "@/lib/i18n";
import { listPrograms } from "@/lib/mock/programs";
import { ProgramCard } from "./program-card";

export function ProgramsIndexDesktop() {
  const t = useT();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        eyebrow={t.programs.eyebrow}
        title={t.programs.indexTitle}
        subtitle={t.programs.indexSubtitle}
        className="mb-12"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listPrograms().map((program, i) => (
          <Reveal key={program.slug} delay={i * 0.08}>
            <ProgramCard
              program={program}
              className="h-full"
              action={<BookmarkButton courseId={program.courseId} variant="icon" />}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
