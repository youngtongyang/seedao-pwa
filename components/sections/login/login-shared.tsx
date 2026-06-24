"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/lib/account";
import type { AuthUser } from "@/lib/api/types";
import { isValidCode, isValidPhone, requestSmsCode } from "@/lib/auth/phone";
import { refreshAuth } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { isMembershipActive } from "@/lib/membership";

/**
 * Pieces shared by the login / join / wallet forms. Kept in their own module so
 * the wallet form (which loads wagmi/RainbowKit lazily) can reuse them without
 * pulling the web3 stack into the rest of the login panel.
 */

export const RESEND_SECONDS = 60;

/** The current page's host, used as the SIWE `domain`. */
export function currentDomain(): string {
  return typeof window !== "undefined" ? window.location.host : "";
}

export function usePhoneCode() {
  const t = useT();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setTimeout(() => setCountdown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  const phoneOk = isValidPhone(phone);
  const codeOk = isValidCode(code);

  const send = useCallback(async () => {
    setNotice(null);
    setSendError(null);
    if (!phoneOk) {
      setSendError(t.login.invalidPhone);
      return;
    }
    setSending(true);
    try {
      const result = await requestSmsCode(phone);
      if (result.ok) {
        setCountdown(RESEND_SECONDS);
        setNotice(t.login.codeSent);
      } else {
        setSendError(t.login.sendFailed);
      }
    } finally {
      setSending(false);
    }
  }, [phone, phoneOk, t]);

  return { phone, setPhone, code, setCode, phoneOk, codeOk, sending, countdown, notice, sendError, send };
}

export type PhoneCode = ReturnType<typeof usePhoneCode>;

export function PhoneCodeFields({ pc }: { pc: PhoneCode }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="auth-phone">{t.login.phoneLabel}</Label>
        <div className="flex items-center gap-2">
          <span className="flex h-11 shrink-0 items-center rounded-xl border border-input bg-muted px-3 text-sm text-muted-foreground">
            +86
          </span>
          <Input
            id="auth-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={11}
            placeholder={t.login.phonePlaceholder}
            value={pc.phone}
            onChange={(e) => pc.setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="auth-code">{t.login.codeLabel}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="auth-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={t.login.codePlaceholder}
            value={pc.code}
            onChange={(e) => pc.setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 whitespace-nowrap"
            disabled={pc.sending || pc.countdown > 0 || !pc.phoneOk}
            onClick={pc.send}
          >
            {pc.sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : pc.countdown > 0 ? (
              t.login.resendIn(pc.countdown)
            ) : (
              t.login.sendCode
            )}
          </Button>
        </div>
      </div>

      {pc.sendError && <p className="text-sm text-destructive">{pc.sendError}</p>}
      {!pc.sendError && pc.notice && <p className="text-sm text-success">{pc.notice}</p>}
    </div>
  );
}

/** Localize a backend error key. */
export function useErrorText() {
  const t = useT();
  return (key?: string): string => {
    const errors = t.login.errors as Record<string, string>;
    return (key && errors[key]) || errors.unknown_error;
  };
}

/**
 * Shared post-auth handoff for flows that land an *active member* on the profile
 * (member phone login, on-chain claim the backend grants membership to). Mirrors
 * membership into the account so the UI agrees with the server's `authed` cookie.
 * Non-members must not be sent here — route them to payment instead.
 */
export function useAuthSuccess() {
  const router = useRouter();
  const account = useAccount();
  return useCallback(
    (user: AuthUser) => {
      if (user) {
        account.setUser(user);
        if (isMembershipActive(user.membership_expires_at)) account.activateMembership();
      }
      refreshAuth();
      router.push("/profile");
    },
    [account, router],
  );
}

export function PanelHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="max-w-xs text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
