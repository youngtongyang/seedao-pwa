"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n, useT } from "@/lib/i18n";
import { localeLabels } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useI18n();
  const t = useT();
  // Show the language you'd switch *to*.
  const next = locale === "zh" ? "en" : "zh";

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t.common.toggleLanguage}
      title={t.common.toggleLanguage}
      className={cn("gap-1.5 text-muted-foreground", className)}
      onClick={toggleLocale}
    >
      <Languages className="size-4" />
      <span className="text-xs font-semibold">{localeLabels[next]}</span>
    </Button>
  );
}
