"use client";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { useT } from "@/lib/i18n";
import { CovenantList } from "./covenant-list";

export function RulesMobile() {
  const t = useT();

  return (
    <section id="rules" className="scroll-mt-16 bg-muted/30 px-5 py-14">
      <SectionHeading
        eyebrow={t.rules.eyebrow}
        title={t.rules.title}
        subtitle={t.rules.subtitle}
      />
      <Reveal className="mt-8">
        <CovenantList />
      </Reveal>
    </section>
  );
}
