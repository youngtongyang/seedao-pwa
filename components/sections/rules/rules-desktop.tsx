"use client";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { useT } from "@/lib/i18n";
import { CovenantList } from "./covenant-list";

export function RulesDesktop() {
  const t = useT();

  return (
    <section id="rules" className="scroll-mt-20 bg-muted/30 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          eyebrow={t.rules.eyebrow}
          title={t.rules.title}
          subtitle={t.rules.subtitle}
        />
        <Reveal className="mt-12">
          <CovenantList />
        </Reveal>
      </div>
    </section>
  );
}
