"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LangToggle } from "@/components/i18n/lang-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { logout, useAuthed } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { ChevronDown, primaryNav, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function ServicesDropdown({ item }: { item: NavItem }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const children = item.children ?? [];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          open && "text-foreground",
        )}
      >
        {t.nav[item.labelKey]}
        <ChevronDown className={cn("size-3.5 opacity-70 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-1 min-w-[11rem] rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          {children.map((child) => (
            <a
              key={child.id}
              role="menuitem"
              href={child.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t.nav[child.labelKey]}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
          <nav className="hidden items-center gap-1 border-r pr-4 mr-4 lg:flex">
            {primaryNav.map((item) => {
              if (item.children?.length) {
                return <ServicesDropdown key={item.id} item={item} />;
              }
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
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
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
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">{t.nav.login}</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/#membership">{t.nav.membership}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
