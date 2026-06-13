"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { useT } from "@/lib/i18n";
import { benefits } from "@/lib/mock/membership";
import { BenefitItem } from "./benefit-item";
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

        <div className="mt-14 grid grid-cols-[1.15fr_0.85fr] gap-12">
          <Reveal>
            <h3 className="mb-6 text-lg font-semibold">
              {t.membership.benefitsTitle}
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-7">
              {benefits.map((b) => (
                <BenefitItem key={b.id} benefit={b} />
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <PaymentPanel />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
