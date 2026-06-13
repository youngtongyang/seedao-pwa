"use client";

import { LifeBuoy } from "lucide-react";
import { useState } from "react";
import { HelpDialog } from "./help-dialog";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Floating "Help is one click away" button. Lives in every shell so support is
 * always reachable. Opens a beautifully framed WeChat QR.
 */
export function HelpFab({ className }: { className?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.help.label}
        className={cn(
          "fixed z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          className,
        )}
      >
        <LifeBuoy className="size-5" />
        <span className="hidden sm:inline">{t.help.label}</span>
      </button>
      <HelpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
