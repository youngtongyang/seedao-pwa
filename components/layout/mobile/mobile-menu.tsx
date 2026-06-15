"use client";

import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  LifeBuoy,
  LogIn,
  LogOut,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { HelpDialog } from "@/components/help/help-dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logout, useAuthed } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { primaryNav } from "@/lib/nav";

export function MobileMenu({ trigger }: { trigger: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const authed = useAuthed();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className="w-[82%] p-6">
          <SheetTitle asChild>
            <Wordmark />
          </SheetTitle>

          <nav className="mt-4 flex flex-col">
            {primaryNav.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-border/70 py-3.5 text-base font-medium"
              >
                <span className="flex items-center gap-3">
                  <item.icon className="size-5 text-muted-foreground" />
                  {t.nav[item.labelKey]}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </nav>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/#membership"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              <CreditCard className="size-5" />
              {t.nav.membership}
            </Link>
            {authed ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium"
                >
                  <UserRound className="size-5" />
                  {t.nav.my}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium"
                >
                  <LogOut className="size-5" />
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium"
              >
                <LogIn className="size-5" />
                {t.nav.login}
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setHelpOpen(true);
              }}
              className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium"
            >
              <LifeBuoy className="size-5" />
              {t.nav.help}
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
