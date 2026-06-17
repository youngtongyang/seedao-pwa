"use client";

import { CheckCircle2, KeyRound, Loader2, Smartphone, XCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SnsCheckResult } from "@/lib/api/types";
import { loginWithCode, registerNewSns } from "@/lib/auth/phone";
import { useT } from "@/lib/i18n";
import { checkSns } from "@/lib/sns/client";
import { isValidUsername, snsNameFor } from "@/lib/profile/types";
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
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <Tabs defaultValue="login">
        <TabsList className="mx-auto flex w-full max-w-xs">
          <TabsTrigger value="login" className="flex-1">
            {t.login.tabLogin}
          </TabsTrigger>
          <TabsTrigger value="join" className="flex-1">
            {t.login.tabJoin}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="join">
          <JoinForms />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Login (existing user) ──────────────────────────────────────────────────────

function LoginForm() {
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
      <PanelHeader icon={<Smartphone className="size-7" />} title={t.login.title} subtitle={t.login.subtitle} />
      <PhoneCodeFields pc={pc} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy || !pc.phoneOk || !pc.codeOk}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {busy ? t.login.loggingIn : t.login.loginCta}
      </Button>
    </form>
  );
}

// ── Join (new user) ────────────────────────────────────────────────────────────

function JoinForms() {
  const t = useT();
  return (
    <Tabs defaultValue="new" className="text-center">
      <PanelHeader icon={<KeyRound className="size-7" />} title={t.login.joinTitle} subtitle={t.login.joinSubtitle} />
      <TabsList className="mx-auto mt-4 flex w-full max-w-xs">
        <TabsTrigger value="new" className="flex-1">
          {t.login.joinNewTab}
        </TabsTrigger>
        <TabsTrigger value="wallet" className="flex-1">
          {t.login.joinWalletTab}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <JoinNewName />
      </TabsContent>
      <TabsContent value="wallet">
        <WalletLogin />
      </TabsContent>
    </Tabs>
  );
}

function JoinNewName() {
  const t = useT();
  const pc = usePhoneCode();
  const errorText = useErrorText();
  const onSuccess = useAuthSuccess();
  const [username, setUsername] = useState("");
  const [check, setCheck] = useState<SnsCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const usernameOk = isValidUsername(username);
  const snsName = snsNameFor(username);

  // Debounced availability check against the real backend. State is only set
  // asynchronously (inside the timeout) to avoid cascading renders; stale
  // results are ignored both by the `seq` guard and by the name match below.
  useEffect(() => {
    if (!usernameOk) return;
    const mine = ++seq.current;
    const id = window.setTimeout(async () => {
      setChecking(true);
      const result = await checkSns(snsName);
      if (mine === seq.current) {
        setCheck(result);
        setChecking(false);
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [snsName, usernameOk]);

  // Only trust a result that belongs to the name currently in the box.
  const current = check && check.sns_name === snsName ? check : null;
  const available = current?.available === true && usernameOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pc.phoneOk) return setError(t.login.invalidPhone);
    if (!usernameOk) return setError(t.login.snsInvalid);
    if (!pc.codeOk) return setError(t.login.invalidCode);
    setBusy(true);
    try {
      const result = await registerNewSns(pc.phone, pc.code, snsName);
      if (result.ok) onSuccess(result.user);
      else setError(errorText(result.error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-center">
      <div className="space-y-1.5 text-left">
        <Label htmlFor="join-sns">{t.login.snsLabel}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="join-sns"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))
            }
            placeholder={t.login.snsPlaceholder}
            autoComplete="off"
          />
          <span className="shrink-0 text-sm text-muted-foreground">.seedao</span>
        </div>
        <SnsStatus username={username} usernameOk={usernameOk} checking={checking} check={current} />
      </div>

      <PhoneCodeFields pc={pc} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={busy || !pc.phoneOk || !pc.codeOk || !available}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {busy ? t.login.joining : t.login.joinCta}
      </Button>
    </form>
  );
}

function SnsStatus({
  username,
  usernameOk,
  checking,
  check,
}: {
  username: string;
  usernameOk: boolean;
  checking: boolean;
  check: SnsCheckResult | null;
}) {
  const t = useT();
  if (!username) return <p className="text-xs text-muted-foreground">{t.login.snsHint}</p>;
  if (!usernameOk) return <p className="text-xs text-destructive">{t.login.snsInvalid}</p>;
  if (checking) return <p className="text-xs text-muted-foreground">{t.login.snsChecking}</p>;
  if (!check) return <p className="text-xs text-muted-foreground">{t.login.snsHint}</p>;
  if (check.available)
    return (
      <p className="flex items-center gap-1 text-xs text-success">
        <CheckCircle2 className="size-3.5" /> {t.login.snsAvailable}
      </p>
    );
  const reasonText =
    check.reason === "invalid_format"
      ? t.login.snsInvalid
      : check.reason === "reserved_word"
        ? t.login.snsReserved
        : t.login.snsTaken;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <XCircle className="size-3.5" /> {reasonText}
    </p>
  );
}
