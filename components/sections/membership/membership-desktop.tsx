"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { useT } from "@/lib/i18n";
import { BenefitRail } from "./benefit-rail";
import { PaymentPanel } from "./payment-panel";

export function MembershipDesktop() {
  const t = useT();

  return (
    <section id="membership" className="scroll-mt-20 bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow={t.membership.eyebrow}
          title={t.membership.title}
          subtitle={t.membership.subtitle}
        />

        <div className="mt-14 grid grid-cols-[1.15fr_0.85fr] items-stretch gap-12">
          <Reveal className="min-w-0 h-full">
            <BenefitRail />
          </Reveal>

          <Reveal delay={0.1}>
            <PaymentPanel />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
