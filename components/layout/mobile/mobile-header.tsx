"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { LangToggle } from "@/components/i18n/lang-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { MobileMenu } from "./mobile-menu";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" aria-label="SEEDAO">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-0.5">
          <LangToggle />
          <ThemeToggle />
          <MobileMenu
            trigger={
              <button
                type="button"
                aria-label="Menu"
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <Menu className="size-5" />
              </button>
            }
          />
        </div>
      </div>
    </header>
  );
}
