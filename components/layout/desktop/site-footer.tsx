"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { useT } from "@/lib/i18n";
import { primaryNav } from "@/lib/nav";

export function SiteFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t.meta.description}
            </p>
            <p className="mt-4 text-gradient-brand text-sm font-semibold">
              {t.footer.slogan}
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.footer.sections}
            </span>
            {primaryNav.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.nav[item.labelKey]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {year} SEEDAO. {t.footer.rights}
          </span>
          <span>{t.footer.madeWith}</span>
        </div>
      </div>
    </footer>
  );
}
