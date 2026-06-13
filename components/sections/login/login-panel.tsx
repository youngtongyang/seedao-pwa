"use client";

import { motion } from "framer-motion";
import {
  Compass,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/account";
import { authProvider } from "@/lib/auth";
import { useT } from "@/lib/i18n";

/** The Feishu (飞书 / Lark) brand mark, simplified. */
function FeishuMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path
        d="M5 6.5c3.4 0 5.6 1.4 7.3 4.2 1.4 2.3 2.9 3.6 5.2 4.1-2 1.6-4.2 2.4-6.6 2.2-2.8-.2-4.9-1.7-6.6-4.3C3.4 10.6 4 8.3 5 6.5Z"
        fill="currentColor"
      />
      <circle cx="17.5" cy="7.5" r="2" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function FeishuButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#3370FF] px-6 text-base font-semibold text-white transition-all hover:bg-[#2860e0] active:scale-[0.98] disabled:opacity-70"
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <FeishuMark className="size-5" />
      )}
      {label}
    </button>
  );
}

export function LoginPanel() {
  const t = useT();
  const account = useAccount();
  const [phase, setPhase] = useState<"idle" | "connecting" | "authorizing">(
    "idle",
  );

  async function handleLogin() {
    setPhase("connecting");
    const timer = window.setTimeout(() => setPhase("authorizing"), 520);
    try {
      const user = await authProvider.signIn();
      account.setUser(user);
    } finally {
      window.clearTimeout(timer);
      setPhase("idle");
    }
  }

  const loading = phase !== "idle";

  // Until persisted state loads, render nothing decisive to avoid a flash.
  if (!account.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-border bg-card">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Gate: members only ───────────────────────────────────────────────
  if (!account.isMember) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Lock className="size-7" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold">{t.login.notMemberTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t.login.notMemberDesc}
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/#membership">{t.login.becomeMember}</Link>
        </Button>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          {t.login.membersOnly}
        </p>
      </div>
    );
  }

  // ── Logged in ────────────────────────────────────────────────────────
  if (account.isLoggedIn && account.user) {
    const initial = account.user.name.slice(0, 1);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {initial}
        </span>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">
            {t.login.welcome(account.user.name)}
          </h2>
          <p className="text-sm text-muted-foreground">{t.login.loggedInDesc}</p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/onboarding">
            <Compass className="size-4" />
            {t.login.goOnboarding}
          </Link>
        </Button>
        <button
          type="button"
          onClick={account.logout}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-4" />
          {t.login.logout}
        </button>
      </motion.div>
    );
  }

  // ── Member, not logged in ────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[#3370FF]/10 text-[#3370FF]">
        <FeishuMark className="size-7" />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold">{t.login.title}</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t.login.subtitle}
        </p>
      </div>

      <FeishuButton
        label={
          phase === "authorizing"
            ? t.login.authorizing
            : phase === "connecting"
              ? t.login.connecting
              : t.login.feishuCta
        }
        loading={loading}
        onClick={handleLogin}
      />

      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        {t.login.demoNote}
      </p>
    </div>
  );
}
