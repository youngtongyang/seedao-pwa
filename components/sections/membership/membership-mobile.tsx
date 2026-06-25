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
        <Reveal>
          {/* Swipeable cards — peek the neighbours so the gesture is discoverable.
              Bleed past the section padding so cards reach both screen edges. */}
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {benefits.map((b) => (
              <div key={b.id} className="w-[78%] shrink-0 snap-center">
                <BenefitItem benefit={b} className="h-72 w-full" />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
