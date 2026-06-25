"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LangToggle } from "@/components/i18n/lang-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { logout, useAuthed } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { primaryNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const authed = useAuthed();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="shrink-0" aria-label="SEEDAO">
          <Wordmark />
        </Link>

        <div className="flex">
          <nav className="hidden items-center gap-1 lg:flex border-r">
            {primaryNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href.split("#")[0]) &&
                    item.href.startsWith("/" + (pathname.split("/")[1] || ""));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "text-foreground",
                  )}
                >
                  {t.nav[item.labelKey]}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <LangToggle />
            <ThemeToggle />
            {authed ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/profile">
                    <UserRound className="size-4" />
                    {t.nav.my}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex"
                >
                  <LogOut className="size-4" />
                  {t.nav.logout}
                </Button>
              </>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/login">{t.nav.login}</Link>
              </Button>
            )}
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/#membership">{t.nav.membership}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
