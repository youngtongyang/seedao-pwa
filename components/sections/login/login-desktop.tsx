"use client";

import { AmbientGlow } from "@/components/shared/ambient";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { benefits } from "@/lib/mock/membership";
import { BenefitItem } from "@/components/sections/membership/benefit-item";
import { LoginPanel } from "./login-panel";

export function LoginDesktop() {
  const t = useT();
  return (
    <section className="relative isolate grid min-h-[calc(100dvh-4rem)] place-items-center overflow-hidden px-6 py-16">
      <AmbientGlow variant="soft" />
      <div className="grid w-full max-w-5xl grid-cols-2 items-center gap-14">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit">
            {t.login.eyebrow}
          </Badge>
          <h1 className="text-gradient-brand text-4xl font-black tracking-tight">
            {t.meta.tagline}
          </h1>
          <p className="max-w-md text-muted-foreground">{t.login.subtitle}</p>
          <div className="mt-2 flex flex-col gap-5">
            {benefits.slice(0, 3).map((b) => (
              <BenefitItem key={b.id} benefit={b} />
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md">
          <LoginPanel />
        </div>
      </div>
    </section>
  );
}
