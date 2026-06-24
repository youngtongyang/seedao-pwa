"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/lib/account";
import type { AuthUser, SnsCheckResult } from "@/lib/api/types";
import { registerNewSns } from "@/lib/auth/phone";
import { refreshAuth } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { membershipPrice } from "@/lib/mock/membership";
import {
  type PendingOrder,
  clearPendingOrder,
  createPaymentOrder,
  pickPayChannel,
  pollPaymentStatus,
  readPendingOrder,
  savePendingOrder,
} from "@/lib/payment/client";
import type { PaymentOrder } from "@/lib/payment/types";
import { isValidUsername, snsNameFor } from "@/lib/profile/types";
import { checkSns } from "@/lib/sns/client";
import { useHydrated } from "@/lib/use-hydrated";
import { PhoneCodeFields, useErrorText, usePhoneCode } from "../login/login-shared";

/**
 * The membership join flow — pick a name → verify phone (free registration that
 * mints the session) → pay membership (WeChat Native QR on desktop, H5 redirect
 * on mobile) → profile. Shared by the home membership panel and the login page's
 * Join tab so both register the exact same way.
 */

const POLL_INTERVAL_MS = 3000;

/**
 * An H5 payer bounced back from WeChat lands with a stashed order. Read it only
 * after hydration (sessionStorage is client-only) so a host can default to the
 * Join tab and resume polling — no SSR mismatch, no setState-in-effect.
 */
export function usePendingJoin(): PendingOrder | null {
  const hydrated = useHydrated();
  return useMemo(() => (hydrated ? readPendingOrder() : null), [hydrated]);
}

/**
 * True when the URL carries `?join=1` (e.g. the login page sends an unregistered
 * phone to `/?join=1#membership`), so a host can open the Join tab. Read after
 * hydration to stay SSR-safe — same reasoning as {@link usePendingJoin}.
 */
export function useJoinIntent(): boolean {
  const hydrated = useHydrated();
  return useMemo(() => {
    if (!hydrated) return false;
    try {
      return new URLSearchParams(window.location.search).get("join") === "1";
    } catch {
      return false;
    }
  }, [hydrated]);
}

type Phase = "name" | "verify" | "pay";

export function JoinFlow({
  initialPending,
  resumePay,
  resumeSnsName,
}: {
  initialPending?: PendingOrder | null;
  /** Signed-in non-member who just needs to pay — start at the QR step. */
  resumePay?: boolean;
  resumeSnsName?: string;
}) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>(initialPending || resumePay ? "pay" : "name");
  const [snsName, setSnsName] = useState<string>(
    initialPending?.sns_name ?? (resumePay ? resumeSnsName ?? "" : ""),
  );
  // Resume an H5 order only on the first pay-phase entry (the round-trip back);
  // a fresh name→verify→pay run leaves this undefined so PayStep opens a new one.
  const [resumeOrderNo] = useState<string | undefined>(initialPending?.order_no);

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Price — the "list price" of membership, like a domain. */}
      <div>
        <div className="flex items-end justify-center gap-1">
          <span className="text-2xl font-semibold text-muted-foreground">
            {t.membership.currency}
          </span>
          <span className="text-5xl font-black tracking-tight">{membershipPrice.amount}</span>
          <span className="mb-1.5 text-sm text-muted-foreground">{t.membership.perYear}</span>
        </div>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t.membership.priceLabel}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {phase === "name" ? (
            <NameStep
              onContinue={(name) => {
                setSnsName(name);
                setPhase("verify");
              }}
            />
          ) : phase === "verify" ? (
            // Registration is free and mints the session; payment then renews
            // *this* user's membership (the backend requires a JWT to pay), so
            // phone verification must precede the QR.
            <VerifyStep
              snsName={snsName}
              onRegistered={() => setPhase("pay")}
              onBack={() => setPhase("name")}
            />
          ) : (
            <PayStep snsName={snsName} resumeOrderNo={resumeOrderNo} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Step 2 — verify phone + code, which registers the name and mints the session. */
function VerifyStep({
  snsName,
  onRegistered,
  onBack,
}: {
  snsName: string;
  onRegistered: (user: AuthUser) => void;
  onBack: () => void;
}) {
  const t = useT();
  const account = useAccount();
  const errorText = useErrorText();
  const pc = usePhoneCode();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pc.phoneOk) return setError(t.login.invalidPhone);
    if (!pc.codeOk) return setError(t.login.invalidCode);
    setBusy(true);
    try {
      const result = await registerNewSns(pc.phone, pc.code, snsName);
      if (result.ok) {
        // Registration mints the session token (needed to open the JWT-only
        // payment order) but does NOT log the user in — membership, and thus
        // profile access, only comes after payment succeeds.
        account.setUser(result.user);
        onRegistered(result.user);
      } else {
        setError(errorText(result.error));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <StepHeading title={t.membership.verifyStepTitle} desc={t.membership.verifyStepDesc} />

      <p className="mx-auto rounded-full bg-primary/10 px-3.5 py-1 text-sm font-medium text-primary">
        {t.membership.payReservedFor(snsName)}
      </p>

      <PhoneCodeFields pc={pc} />
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={busy || !pc.phoneOk || !pc.codeOk}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {busy ? t.membership.verifying : t.membership.verifyCta}
        {!busy && <ArrowRight className="size-4" />}
      </Button>

      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
        <ArrowLeft className="size-4" />
        {t.membership.verifyBack}
      </Button>
    </form>
  );
}

/** Pick a `{username}.seedao` name with live availability — domain-buying UX. */
function NameStep({ onContinue }: { onContinue: (snsName: string) => void }) {
  const t = useT();
  const [username, setUsername] = useState("");
  const [check, setCheck] = useState<SnsCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const seq = useRef(0);

  const usernameOk = isValidUsername(username);
  const snsName = snsNameFor(username);

  // Debounced availability check against the real backend; stale results are
  // dropped both by the `seq` guard and the name match below.
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

  const current = check && check.sns_name === snsName ? check : null;
  const available = current?.available === true && usernameOk;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (available) onContinue(snsName);
      }}
      className="flex flex-col gap-5"
    >
      <StepHeading title={t.membership.nameStepTitle} desc={t.membership.nameStepDesc} />

      <div className="space-y-1.5 text-left">
        <Label htmlFor="join-name">{t.login.snsLabel}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="join-name"
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

      <Button type="submit" size="lg" className="w-full" disabled={!available}>
        {t.membership.nameNextCta}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}

type PayState =
  | "creating"
  | "waiting" // Native: QR shown, polling
  | "redirecting" // H5: leaving for WeChat
  | "confirming" // H5: back from WeChat, polling
  | "paid"
  | "expired"
  | "error";

/**
 * Renew membership. On desktop this shows a WeChat Native QR and polls; on
 * mobile it opens an H5 order and redirects into WeChat, stashing the order so
 * polling resumes when the user is bounced back (`resumeOrderNo`).
 */
function PayStep({ snsName, resumeOrderNo }: { snsName: string; resumeOrderNo?: string }) {
  const t = useT();
  const router = useRouter();
  const account = useAccount();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  // The id we poll — a freshly created order, or the stashed one we resumed.
  const [orderNo, setOrderNo] = useState<string | null>(resumeOrderNo ?? null);
  const [state, setState] = useState<PayState>(resumeOrderNo ? "confirming" : "creating");

  // Open an order whenever we don't have one (mount, retry). Skipped on resume,
  // where `orderNo` is already set and we go straight to polling. The user is
  // signed in (verify step), so the JWT-only create uses the session cookie.
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (orderNo) return;
    let active = true;
    const channel = pickPayChannel();
    createPaymentOrder({ pay_channel: channel }).then((res) => {
      if (!active) return;
      if (!res.ok) {
        // No valid session (e.g. resuming pay after it expired) → re-authenticate.
        if (res.error === "unauthorized") {
          router.push("/login");
          return;
        }
        setState("error");
        return;
      }
      const o = res.order;
      setOrder(o);
      setOrderNo(o.order_no);
      if (channel === "wechat_h5" && o.h5_url) {
        // Stash, then hand off to WeChat — we'll resume polling on the way back.
        savePendingOrder(o.order_no, snsName);
        setState("redirecting");
        window.location.href = o.h5_url;
      } else {
        setState("waiting");
      }
    });
    return () => {
      active = false;
    };
  }, [orderNo, snsName, nonce, router]);

  function retry() {
    clearPendingOrder();
    setOrder(null);
    setOrderNo(null); // → triggers a fresh create
    setState("creating");
    setNonce((n) => n + 1);
  }

  // Poll order status while waiting (Native) or confirming (H5 round-trip).
  // WeChat's notify webhook drives the backend; we read it back and hand off.
  useEffect(() => {
    if ((state !== "waiting" && state !== "confirming") || !orderNo) return;
    let active = true;
    const id = window.setInterval(async () => {
      const res = await pollPaymentStatus(orderNo);
      if (!active) return;
      if (!res.ok) {
        // Lost session can't recover by polling; transient errors keep trying.
        if (res.error === "unauthorized") {
          window.clearInterval(id);
          clearPendingOrder();
          setState("error");
        }
        return;
      }
      if (res.status === "paid") {
        window.clearInterval(id);
        clearPendingOrder();
        setState("paid");
        // Payment promoted the session to a member (the status route set the
        // `authed` cookie); mirror it client-side and refresh the header.
        account.activateMembership();
        refreshAuth();
        router.push("/profile");
      } else if (res.status === "closed") {
        // Order no longer payable (expired / closed / failed) — offer a fresh one.
        window.clearInterval(id);
        clearPendingOrder();
        setState("expired");
      }
    }, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [state, orderNo, account, router]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <StepHeading title={t.membership.payStepTitle} desc={t.membership.payStepDesc} />

      {snsName && (
        <p className="rounded-full bg-primary/10 px-3.5 py-1 text-sm font-medium text-primary">
          {t.membership.payReservedFor(snsName)}
        </p>
      )}

      {state === "waiting" && order?.code_url ? (
        <QrCode key={order.code_url} value={order.code_url} alt={t.membership.payQrAlt} size={172} />
      ) : state === "creating" || state === "redirecting" || state === "confirming" ? (
        <div className="flex h-[204px] w-[204px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      <PayStatusLine state={state} />

      {(state === "expired" || state === "error") && (
        <Button size="lg" className="w-full" onClick={retry}>
          {t.membership.payRetry}
        </Button>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-left text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        {t.membership.payAutoNote}
      </p>
    </div>
  );
}

function PayStatusLine({ state }: { state: PayState }) {
  const t = useT();
  if (state === "waiting")
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t.membership.payWaiting}
      </p>
    );
  if (state === "redirecting" || state === "confirming")
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {state === "redirecting" ? t.membership.payRedirecting : t.membership.payConfirming}
      </p>
    );
  if (state === "paid")
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="size-4" />
        {t.membership.paySuccess}
      </p>
    );
  if (state === "expired")
    return <p className="text-sm text-destructive">{t.membership.payExpired}</p>;
  if (state === "error")
    return <p className="text-sm text-destructive">{t.membership.payError}</p>;
  return null;
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

export function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1.5 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
