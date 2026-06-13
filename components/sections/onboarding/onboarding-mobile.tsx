"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { OnboardingGame } from "./onboarding-game";

export function OnboardingMobile() {
  const t = useT();
  return (
    <div className="px-5 py-8">
      <header className="mb-6 text-center">
        <Badge variant="secondary" className="mb-2">
          {t.onboarding.eyebrow}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {t.onboarding.title}
        </h1>
        <p className="mx-auto mt-2 text-muted-foreground">
          {t.onboarding.subtitle}
        </p>
      </header>
      <OnboardingGame variant="mobile" />
    </div>
  );
}
