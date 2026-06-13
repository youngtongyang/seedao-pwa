"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { OnboardingGame } from "./onboarding-game";

export function OnboardingDesktop() {
  const t = useT();
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10 text-center">
        <Badge variant="secondary" className="mb-3">
          {t.onboarding.eyebrow}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          {t.onboarding.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
          {t.onboarding.subtitle}
        </p>
      </header>
      <OnboardingGame variant="desktop" />
    </div>
  );
}
