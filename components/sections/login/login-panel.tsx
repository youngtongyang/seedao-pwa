"use client";

import { KeyRound, Loader2, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isValidCode,
  isValidPhone,
  requestSmsCode,
  verifyPhoneCode,
} from "@/lib/auth/phone";
import { useT } from "@/lib/i18n";

const RESEND_SECONDS = 60;

export function LoginPanel() {
  const t = useT();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Tick the resend countdown down to zero.
  useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  const phoneOk = isValidPhone(phone);
  const codeOk = isValidCode(code);

  async function handleSend() {
    setError(null);
    setNotice(null);
    if (!phoneOk) {
      setError(t.login.invalidPhone);
      return;
    }
    setSending(true);
    try {
      const result = await requestSmsCode(phone);
      if (result.ok) {
        setCountdown(RESEND_SECONDS);
        setNotice(t.login.codeSent);
      } else {
        setError(t.login.sendFailed);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phoneOk) {
      setError(t.login.invalidPhone);
      return;
    }
    if (!codeOk) {
      setError(t.login.invalidCode);
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyPhoneCode(phone, code);
      if (result.ok) {
        router.push("/profile");
      } else {
        setError(t.login.verifyFailed);
      }
    } finally {
      setVerifying(false);
    }
  }

  return (
    <form
      onSubmit={handleVerify}
      className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-8 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Smartphone className="size-7" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold">{t.login.title}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t.login.subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="login-phone">{t.login.phoneLabel}</Label>
          <div className="flex items-center gap-2">
            <span className="flex h-11 shrink-0 items-center rounded-xl border border-input bg-muted px-3 text-sm text-muted-foreground">
              +86
            </span>
            <Input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={11}
              placeholder={t.login.phonePlaceholder}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-code">{t.login.codeLabel}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t.login.codePlaceholder}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 whitespace-nowrap"
              disabled={sending || countdown > 0 || !phoneOk}
              onClick={handleSend}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : countdown > 0 ? (
                t.login.resendIn(countdown)
              ) : (
                t.login.sendCode
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && notice && (
        <p className="text-sm text-success">{notice}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={verifying || !phoneOk || !codeOk}
      >
        {verifying ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.login.verifying}
          </>
        ) : (
          <>
            <KeyRound className="size-4" />
            {t.login.verifyCta}
          </>
        )}
      </Button>

      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        {t.login.demoNote}
      </p>
    </form>
  );
}
