"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/lib/account";
import { consumeReturnTo, returnToForPayment } from "@/lib/auth/return-to";
import type { AuthUser, SnsCheckResult } from "@/lib/api/types";
import { registerNewSns } from "@/lib/auth/phone";
import { refreshAuth } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import {
  type PendingOrder,
  availablePayChannels,
  clearPendingOrder,
  closePaymentOrder,
  createPaymentOrder,
  defaultPayChannel,
  findInFlightOrder,
  isMobileDevice,
  navigateToPayment,
  openPaymentRedirect,
  pollPaymentStatus,
  previewMembershipCoupon,
  readPendingOrder,
  savePendingOrder,
} from "@/lib/payment/client";
import type { PayChannel, PaymentOrder } from "@/lib/payment/types";
import { isAlipayChannel, isRedirectPayChannel, paymentRedirectUrl } from "@/lib/payment/types";
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
  const [priceYuan, setPriceYuan] = useState<number | null>(null);
  const [priceFailed, setPriceFailed] = useState(false);

  useEffect(() => {
    let active = true;
    previewMembershipCoupon({ product_type: "membership_renew", days: 365 }).then((r) => {
      if (!active) return;
      if (r.ok && r.displayYuan > 0) {
        setPriceYuan(r.displayYuan);
        setPriceFailed(false);
      } else {
        setPriceFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Price from coupons/preview — never hardcode 35/299. */}
      <div>
        <div className="flex items-end justify-center gap-1">
          <span className="text-2xl font-semibold text-muted-foreground">
            {t.membership.currency}
          </span>
          <span className="text-5xl font-black tracking-tight">
            {priceYuan !== null ? priceYuan : "—"}
          </span>
          <span className="mb-1.5 text-sm text-muted-foreground">{t.membership.perYear}</span>
        </div>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {priceFailed
            ? t.membership.payPriceFailed
            : priceYuan === null
              ? t.membership.payPriceLoading
              : t.membership.priceLabel}
        </p>
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
            <PayStep
              snsName={snsName}
              resumeOrderNo={resumeOrderNo}
              priceYuan={priceYuan}
            />
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
  const pc = usePhoneCode({ purpose: "register" });
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
  | "pick" // Choose a pay channel before creating an order (desktop WeChat/Alipay, or multi-H5)
  | "creating"
  | "waiting" // Native: QR shown, polling
  | "h5Ready" // Redirect channel: order open, waiting for the user to tap through
  | "confirming" // Redirect: handed off, polling for the result
  | "paid"
  | "expired"
  | "error";

/**
 * Renew membership.
 * Desktop: pick WeChat Native QR or Alipay PC page, then pay + poll.
 * Mobile: Alipay H5 (optionally WeChat H5), hand off on tap without tearing down
 * this page so polling keeps running; stashed order resumes after full reload.
 */
function PayStep({
  snsName,
  resumeOrderNo,
  priceYuan,
}: {
  snsName: string;
  resumeOrderNo?: string;
  priceYuan: number | null;
}) {
  const t = useT();
  const router = useRouter();
  const account = useAccount();
  const mobile = isMobileDevice();
  const payChannels = availablePayChannels(mobile);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [payChannel, setPayChannel] = useState<PayChannel | null>(null);
  // The id we poll — a freshly created order, or the stashed one we resumed.
  const [orderNo, setOrderNo] = useState<string | null>(resumeOrderNo ?? null);
  // Start on "pick" when multiple channels exist so we never flash WeChat copy
  // while the bootstrap effect is still deciding.
  const [state, setState] = useState<PayState>(() => {
    if (resumeOrderNo) return "confirming";
    if (availablePayChannels().length > 1) return "pick";
    return "creating";
  });

  const [nonce, setNonce] = useState(0);

  const openOrder = useCallback(
    async (channel: PayChannel, activeRef: { current: boolean }, handoffNow = false) => {
      setPayChannel(channel);
      setState("creating");
      const res = await createPaymentOrder({
        pay_channel: channel,
        return_to: returnToForPayment(undefined, "/profile"),
      });
      if (!activeRef.current) return;
      if (!res.ok) {
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
      // Prefer the channel the backend actually opened (guards against drift).
      setPayChannel(o.pay_channel ?? channel);
      const redirectUrl = paymentRedirectUrl(o);
      if (isRedirectPayChannel(o.pay_channel ?? channel) && redirectUrl) {
        if (handoffNow) {
          savePendingOrder(o.order_no, snsName);
          // Same-tab leave: when the user comes back unpaid, resume lands on h5Ready.
          // Keep a brief confirming state only until navigation starts.
          setState("confirming");
          navigateToPayment(redirectUrl);
          return;
        }
        setState("h5Ready");
      } else {
        setState("waiting");
      }
    },
    [router, snsName],
  );

  // Bootstrap: hydrate a resumed order, or open/pick a channel for a fresh pay.
  useEffect(() => {
    const active = { current: true };

    (async () => {
      // Stashed H5/Alipay return: orderNo is set but channel/copy must be loaded.
      if (orderNo && !order) {
        const res = await pollPaymentStatus(orderNo);
        if (!active.current) return;
        if (!res.ok) {
          if (res.error === "unauthorized") {
            clearPendingOrder();
            setState("error");
          }
          return;
        }
        const o = res.order;
        setOrder(o);
        setPayChannel(o.pay_channel);
        if (res.status === "paid") {
          clearPendingOrder();
          setState("paid");
          account.activateMembership();
          refreshAuth();
          router.push(consumeReturnTo("/profile"));
          return;
        }
        if (res.status === "closed") {
          clearPendingOrder();
          setOrder(null);
          setOrderNo(null);
          setPayChannel(null);
          setState("expired");
          return;
        }
        // Unpaid return from Alipay/WeChat H5: show re-entry CTA, don't spin forever.
        setState(paymentRedirectUrl(o) ? "h5Ready" : "waiting");
        return;
      }

      if (orderNo) return;

      const existing = await findInFlightOrder();
      if (!active.current) return;
      if (existing.ok && existing.order) {
        const o = existing.order;
        if (o.status === "paid") {
          clearPendingOrder();
          setOrder(o);
          setOrderNo(o.order_no);
          setPayChannel(o.pay_channel);
          setState("paid");
          account.activateMembership();
          refreshAuth();
          router.push(consumeReturnTo("/profile"));
          return;
        }
        if (o.status === "pending" && (o.code_url || paymentRedirectUrl(o))) {
          setOrder(o);
          setOrderNo(o.order_no);
          setPayChannel(o.pay_channel);
          setState(paymentRedirectUrl(o) ? "h5Ready" : "waiting");
          return;
        }
      }

      const channels = availablePayChannels(mobile);
      if (channels.length > 1) {
        setState("pick");
        return;
      }

      if (mobile) {
        await openOrder(defaultPayChannel(), active, true);
        return;
      }

      await openOrder(channels[0] ?? "wechat_native", active);
    })();

    return () => {
      active.current = false;
    };
  }, [orderNo, order, nonce, mobile, account, router, openOrder]);

  function startPay(channel: PayChannel) {
    // Redirect channels hand off immediately; Native stays on the QR + poll UI.
    void openOrder(channel, { current: true }, isRedirectPayChannel(channel));
  }

  function handoff() {
    const url = order ? paymentRedirectUrl(order) : undefined;
    if (!url || !order) return;
    savePendingOrder(order.order_no, snsName);
    setState("confirming");
    openPaymentRedirect(url);
  }

  function retry() {
    clearPendingOrder();
    setOrder(null);
    setOrderNo(null);
    setPayChannel(null);
    setState("creating");
    setNonce((n) => n + 1);
  }

  /** Abandon the current pending order and let the user pick another channel. */
  function changeChannel() {
    const abandoned = orderNo;
    clearPendingOrder();
    setOrder(null);
    setOrderNo(null);
    setPayChannel(null);
    if (abandoned) void closePaymentOrder(abandoned);
    setState("creating");
    setNonce((n) => n + 1);
  }

  // Poll order status whenever an order is open: the Native QR is up (`waiting`),
  // the H5 tap-through is shown (`h5Ready` — a resumed order may already be paid),
  // or we've handed off (`confirming`). Provider notify drives the backend; we
  // read it back. We poll once immediately and again whenever the tab becomes
  // visible — so returning from Alipay/WeChat confirms at once.
  useEffect(() => {
    if ((state !== "waiting" && state !== "h5Ready" && state !== "confirming") || !orderNo) return;
    const pollOrderNo = orderNo;
    let active = true;
    let settled = false;

    async function check() {
      if (settled) return;
      const res = await pollPaymentStatus(pollOrderNo);
      if (!active || settled) return;
      if (!res.ok) {
        if (res.error === "unauthorized") {
          settled = true;
          clearPendingOrder();
          setState("error");
        }
        return;
      }
      if (res.status === "paid") {
        settled = true;
        clearPendingOrder();
        setState("paid");
        account.activateMembership();
        refreshAuth();
        router.push(consumeReturnTo("/profile"));
        return;
      }
      if (res.status === "closed") {
        settled = true;
        clearPendingOrder();
        setState("expired");
        return;
      }
      // Still pending after leaving the cashier — stop the endless spinner and
      // offer "continue pay" / "change method" instead.
      if (res.status === "pending" && state === "confirming") {
        setState("h5Ready");
      }
    }

    check();
    const id = window.setInterval(check, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [state, orderNo, account, router]);

  // Match the heading to what's actually on screen / on the order.
  const activeChannel = order?.pay_channel ?? payChannel;
  const showPicker = payChannels.length > 1 && (state === "pick" || (state === "creating" && !activeChannel));

  const payTitle = showPicker
    ? t.membership.payStepTitlePick
    : isAlipayChannel(activeChannel)
      ? t.membership.payStepTitleAlipay
      : activeChannel
        ? t.membership.payStepTitle
        : t.membership.payStepTitlePick;

  const amount = priceYuan ?? 0;
  const payDesc = showPicker
    ? t.membership.payStepDescPick(amount)
    : state === "waiting"
      ? t.membership.payStepDescNative(amount)
      : isAlipayChannel(activeChannel) && (state === "h5Ready" || state === "confirming")
        ? activeChannel === "alipay_page"
          ? t.membership.payStepDescAlipayPage(amount)
          : t.membership.payStepDescAlipayH5(amount)
        : state === "h5Ready" || state === "confirming"
          ? t.membership.payStepDescH5(amount)
          : isAlipayChannel(activeChannel)
            ? t.membership.payStepDescAlipayH5(amount)
            : activeChannel
              ? t.membership.payStepDesc(amount)
              : t.membership.payStepDescPick(amount);

  const h5Cta =
    isAlipayChannel(activeChannel) ? t.membership.payAlipayH5Cta : t.membership.payH5Cta;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <StepHeading title={payTitle} desc={payDesc} />

      {snsName && (
        <p className="rounded-full bg-primary/10 px-3.5 py-1 text-sm font-medium text-primary">
          {t.membership.payReservedFor(snsName)}
        </p>
      )}

      {showPicker ? (
        <div className="flex w-full flex-col gap-3">
          {state === "creating" && !activeChannel ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {payChannels.includes("wechat_native") && (
                <Button size="lg" className="w-full" onClick={() => startPay("wechat_native")}>
                  {t.membership.payWechatNativeCta}
                  <ArrowRight className="size-4" />
                </Button>
              )}
              {payChannels.includes("wechat_h5") && (
                <Button size="lg" className="w-full" onClick={() => startPay("wechat_h5")}>
                  {t.membership.payWechatH5Cta}
                  <ArrowRight className="size-4" />
                </Button>
              )}
              {payChannels.includes("alipay_page") && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => startPay("alipay_page")}
                >
                  {t.membership.payAlipayH5Cta}
                  <ArrowRight className="size-4" />
                </Button>
              )}
              {payChannels.includes("alipay_h5") && (
                <Button
                  size="lg"
                  variant={payChannels.length > 1 ? "outline" : "default"}
                  className="w-full"
                  onClick={() => startPay("alipay_h5")}
                >
                  {t.membership.payAlipayH5Cta}
                  {payChannels.length === 1 && <ArrowRight className="size-4" />}
                </Button>
              )}
            </>
          )}
        </div>
      ) : state === "waiting" && order?.code_url ? (
        <QrCode key={order.code_url} value={order.code_url} alt={t.membership.payQrAlt} size={172} />
      ) : state === "h5Ready" ? (
        <div className="flex w-full flex-col gap-3">
          <Button size="lg" className="w-full" onClick={handoff}>
            {h5Cta}
            <ArrowRight className="size-4" />
          </Button>
          {payChannels.length > 1 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={changeChannel}>
              {t.membership.payChangeChannel}
            </Button>
          )}
        </div>
      ) : state === "creating" || state === "confirming" ? (
        <div className="flex h-[204px] w-[204px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      <PayStatusLine state={state} payChannel={activeChannel} />

      {state === "waiting" && payChannels.length > 1 && (
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={changeChannel}>
          {t.membership.payChangeChannel}
        </Button>
      )}

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

function PayStatusLine({ state, payChannel }: { state: PayState; payChannel: PayChannel | null }) {
  const t = useT();
  if (state === "waiting")
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t.membership.payWaiting}
      </p>
    );
  if (state === "h5Ready")
    return (
      <p className="text-sm text-muted-foreground">
        {isAlipayChannel(payChannel) ? t.membership.payH5ReadyAlipay : t.membership.payH5ReadyWechat}
      </p>
    );
  if (state === "confirming")
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {isAlipayChannel(payChannel) ? t.membership.payConfirmingAlipay : t.membership.payConfirming}
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
