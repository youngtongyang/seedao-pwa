"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { useT } from "@/lib/i18n";
import { benefits } from "@/lib/mock/membership";
import { BenefitItem } from "./benefit-item";
import { PaymentPanel } from "./payment-panel";

export function MembershipMobile() {
  const t = useT();

  return (
    <section id="membership" className="scroll-mt-16 bg-muted/30 px-5 py-14">
      <SectionHeading
        eyebrow={t.membership.eyebrow}
        title={t.membership.title}
        subtitle={t.membership.subtitle}
      />

      <Reveal className="mt-8">
        <PaymentPanel />
      </Reveal>

      <div className="mt-8">
        <h3 className="mb-4 text-base font-semibold">
          {t.membership.benefitsTitle}
        </h3>
        <div className="flex flex-col gap-5">
          {benefits.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.04}>
              <BenefitItem benefit={b} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
