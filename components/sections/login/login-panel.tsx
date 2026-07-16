"use client";

import { KeyRound, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReturnToCapture } from "@/components/auth/return-to-capture";
import { useAccount } from "@/lib/account";
import { joinHref } from "@/lib/auth/return-to";
import { loginWithCode } from "@/lib/auth/phone";
import { useT } from "@/lib/i18n";
import { isMembershipActive } from "@/lib/membership";
import {
  PanelHeader,
  PhoneCodeFields,
  useAuthSuccess,
  useErrorText,
  usePhoneCode,
} from "./login-shared";

/**
 * Header login — phone number only. Registration lives on the home page's Join
 * panel, so a phone with no account is sent there (`REGISTER_HREF`).
 */

// Where unregistered phones (and the "no account?" link) go: the home membership
// section, with the Join tab pre-opened. `returnTo` is appended when present.
function registerHref(): string {
  return joinHref();
}

// Failures that mean "fix it and retry here" rather than "you have no account".
// `phone_not_registered` (40009) stays put too: we show the message and let the
// user follow the "Register" link below, rather than redirecting silently.
const STAY_ERRORS = new Set([
  "invalid_code",
  "rate_limited",
  "invalid_param",
  "upstream_unreachable",
  "internal",
  "phone_not_registered",
]);

export function LoginPanel() {
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <ReturnToCapture />
      <PhoneLoginForm />
    </div>
  );
}

function PhoneLoginForm() {
  const t = useT();
  const router = useRouter();
  const account = useAccount();
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
      if (result.ok && isMembershipActive(result.user.membership_expires_at)) {
        onSuccess(result.user); // active member → profile
      } else if (result.ok) {
        // Registered but not a paying member — can't log in; remember who they
        // are and send them to finish payment (the Join flow resumes at the QR).
        account.setUser(result.user);
        router.push(registerHref());
      } else if (result.error && STAY_ERRORS.has(result.error)) {
        setError(errorText(result.error));
      } else {
        router.push(registerHref());
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-center">
      <PanelHeader
        icon={<Smartphone className="size-7" />}
        title={t.login.loginTitle}
        subtitle={t.login.loginSubtitle}
      />
      <PhoneCodeFields pc={pc} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy || !pc.phoneOk || !pc.codeOk}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {busy ? t.login.loggingIn : t.login.loginCta}
      </Button>
      <p className="text-sm text-muted-foreground">
        {t.login.noAccount}{" "}
        <Link
          href={registerHref()}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t.login.noAccountCta}
        </Link>
      </p>
    </form>
  );
}
