"use client";

import { KeyRound, Loader2, Smartphone } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginWithCode } from "@/lib/auth/phone";
import { useT } from "@/lib/i18n";
import { JoinFlow, usePendingJoin } from "../membership/join-flow";
import {
  PanelHeader,
  PhoneCodeFields,
  useAuthSuccess,
  useErrorText,
  usePhoneCode,
} from "./login-shared";

// The wallet stack (wagmi/RainbowKit) loads only when this tab is opened — Radix
// mounts inactive tab content lazily, so the chunk is fetched on first click.
const WalletLogin = dynamic(() => import("./wallet-login"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-10">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function LoginPanel() {
  const t = useT();
  // A returning H5 payer (who joined from here) comes back with a stashed order
  // — default to the Join tab and resume. Re-key so it applies post-hydration.
  const pending = usePendingJoin();

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <Tabs defaultValue={pending ? "join" : "login"} key={pending?.order_no ?? "default"}>
        <TabsList className="mx-auto flex w-full max-w-xs">
          <TabsTrigger value="login" className="flex-1">
            {t.login.tabLogin}
          </TabsTrigger>
          <TabsTrigger value="join" className="flex-1">
            {t.login.tabJoin}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForms />
        </TabsContent>
        <TabsContent value="join">
          {/* Same register→pay→profile flow as the home membership panel. */}
          <JoinFlow initialPending={pending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Login (existing user) ──────────────────────────────────────────────────────

/** Two ways to log in: with a phone number, or by proving an on-chain SNS. */
function LoginForms() {
  const t = useT();
  return (
    <Tabs defaultValue="phone" className="text-center">
      <PanelHeader icon={<Smartphone className="size-7" />} title={t.login.loginTitle} subtitle={t.login.loginSubtitle} />
      <TabsList className="mx-auto mt-4 flex w-full max-w-xs">
        <TabsTrigger value="phone" className="flex-1">
          {t.login.loginPhoneTab}
        </TabsTrigger>
        <TabsTrigger value="wallet" className="flex-1">
          {t.login.loginWalletTab}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="phone">
        <PhoneLoginForm />
      </TabsContent>
      <TabsContent value="wallet">
        <WalletLogin />
      </TabsContent>
    </Tabs>
  );
}

function PhoneLoginForm() {
  const t = useT();
  const pc = usePhoneCode();
  const errorText = useErrorText();
  const onSuccess = useAuthSuccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pc.phoneOk) return setError(t.login.invalidPhone);
    if (!pc.codeOk) return setError(t.login.invalidCode);
    setBusy(true);
    try {
      const result = await loginWithCode(pc.phone, pc.code);
      if (result.ok) onSuccess(result.user);
      else setError(errorText(result.error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-center">
      <PhoneCodeFields pc={pc} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy || !pc.phoneOk || !pc.codeOk}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {busy ? t.login.loggingIn : t.login.loginCta}
      </Button>
    </form>
  );
}
