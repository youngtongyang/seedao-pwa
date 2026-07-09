"use client";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { BookmarkButton } from "@/components/sections/program/bookmark-button";
import { useT } from "@/lib/i18n";
import { listPrograms } from "@/lib/mock/programs";
import { ProgramCard } from "./program-card";

export function ProgramsIndexMobile() {
  const t = useT();

  return (
    <div className="px-4 py-8">
      <SectionHeading
        eyebrow={t.programs.eyebrow}
        title={t.programs.indexTitle}
        subtitle={t.programs.indexSubtitle}
        className="mb-8"
      />
      <div className="space-y-4">
        {listPrograms().map((program, i) => (
          <Reveal key={program.slug} delay={i * 0.06}>
            <ProgramCard
              program={program}
              action={<BookmarkButton courseId={program.courseId} variant="icon" />}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
