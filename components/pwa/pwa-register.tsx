"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { useT } from "@/lib/i18n";

const DISMISS_KEY = "seedao.install.dismissed";

/** Registers the service worker and shows a one-time iOS install hint. */
export function PWARegister() {
  const t = useT();
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";

    if (isIOS && !isStandalone && !dismissed) {
      const timer = window.setTimeout(() => setShowInstall(true), 2600);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    setShowInstall(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {showInstall && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-4 bottom-28 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-4"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label={t.nav.close}
            className="absolute right-3 top-3 text-muted-foreground"
          >
            <X className="size-4" />
          </button>
          <Wordmark className="mb-2" />
          <p className="text-sm font-semibold">{t.install.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Share className="size-4 shrink-0 text-primary" />
            {t.install.iosHint}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 text-xs font-medium text-muted-foreground"
          >
            {t.install.dismiss}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
