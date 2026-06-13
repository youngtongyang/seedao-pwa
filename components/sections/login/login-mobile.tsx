"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { LoginPanel } from "./login-panel";

export function LoginMobile() {
  const t = useT();
  return (
    <section className="px-5 py-10">
      <header className="mb-7 text-center">
        <Badge variant="secondary" className="mb-2">
          {t.login.eyebrow}
        </Badge>
        <h1 className="text-gradient-brand text-3xl font-black tracking-tight">
          {t.meta.tagline}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          {t.login.subtitle}
        </p>
      </header>
      <LoginPanel />
    </section>
  );
}
