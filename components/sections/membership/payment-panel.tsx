"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QrCode } from "@/components/shared/qr-code";
import { QRFrame } from "@/components/shared/qr-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount } from "@/lib/account";
import type { SnsCheckResult } from "@/lib/api/types";
import { useT } from "@/lib/i18n";
import { membershipPrice } from "@/lib/mock/membership";
import { createPaymentOrder, pollPaymentStatus } from "@/lib/payment/client";
import type { PaymentOrder } from "@/lib/payment/types";
import { isValidUsername, snsNameFor } from "@/lib/profile/types";
import { checkSns } from "@/lib/sns/client";
import { cn } from "@/lib/utils";
import { useAuthSuccess } from "../login/login-shared";

const POLL_INTERVAL_MS = 3000;

export function PaymentPanel({ className }: { className?: string }) {
  const t = useT();

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-border bg-card p-7",
        className,
      )}
    >
      <Tabs defaultValue="spectate">
        <TabsList className="mx-auto flex w-full max-w-xs">
          <TabsTrigger value="spectate" className="flex-1">
            {t.membership.tabSpectate}
          </TabsTrigger>
          <TabsTrigger value="join" className="flex-1">
            {t.membership.tabJoin}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spectate">
          <SpectatePanel />
        </TabsContent>
        <TabsContent value="join">
          <JoinFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── 围观 (look around) ──────────────────────────────────────────────────────────

function SpectatePanel() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <StepHeading title={t.membership.spectateTitle} desc={t.membership.spectateDesc} />
      <QRFrame src="/qr/feishu-group.svg" alt={t.membership.spectateQrAlt} size={172} withBadge={false} />
      <p className="text-sm text-muted-foreground">{t.membership.spectateQrHint}</p>
    </div>
  );
}

// ── 加入 (join) ─────────────────────────────────────────────────────────────────

type Phase = "name" | "pay";

function JoinFlow() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("name");
  const [snsName, setSnsName] = useState<string>("");

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Price — the "list price" of the name, like a domain. */}
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
                setPhase("pay");
              }}
            />
          ) : (
            <PayStep snsName={snsName} onBack={() => setPhase("name")} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
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
  // dropped both by the `seq` guard and the name match below (mirrors the Join
  // form in login-panel).
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

type PayState = "creating" | "waiting" | "paid" | "expired" | "error";

/** Show the WeChat Native QR for the reserved name and poll until paid. */
function PayStep({ snsName, onBack }: { snsName: string; onBack: () => void }) {
  const t = useT();
  const account = useAccount();
  const onAuthSuccess = useAuthSuccess();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [state, setState] = useState<PayState>("creating");

  // Open the order when this step mounts (and on explicit retry via `nonce`).
  // The "creating" reset lives in the retry handler, not here, so the effect
  // only sets state asynchronously once the order resolves.
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let active = true;
    createPaymentOrder(snsName).then((res) => {
      if (!active) return;
      if (res.ok) {
        setOrder(res.order);
        setState("waiting");
      } else {
        setState("error");
      }
    });
    return () => {
      active = false;
    };
  }, [snsName, nonce]);

  function retry() {
    setOrder(null);
    setState("creating");
    setNonce((n) => n + 1);
  }

  // Poll order status while waiting. WeChat's notify webhook drives the backend;
  // we just read it back here and hand off to the profile once paid.
  useEffect(() => {
    if (state !== "waiting" || !order) return;
    let active = true;
    const id = window.setInterval(async () => {
      const res = await pollPaymentStatus(order.out_trade_no);
      if (!active || !res.ok) return;
      if (res.status === "paid") {
        window.clearInterval(id);
        setState("paid");
        account.activateMembership();
        if (res.user) onAuthSuccess(res.user); // sets user, refreshes auth, → /profile
      } else if (res.status === "closed") {
        // Code no longer payable (expired / closed / failed) — offer a fresh one.
        window.clearInterval(id);
        setState("expired");
      }
    }, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [state, order, account, onAuthSuccess]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <StepHeading title={t.membership.payStepTitle} desc={t.membership.payStepDesc} />

      <p className="rounded-full bg-primary/10 px-3.5 py-1 text-sm font-medium text-primary">
        {t.membership.payReservedFor(snsName)}
      </p>

      {state === "creating" ? (
        <div className="flex h-[204px] w-[204px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : order ? (
        <QrCode key={order.code_url} value={order.code_url} alt={t.membership.payQrAlt} size={172} />
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

      {state !== "paid" && (
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="size-4" />
          {t.membership.payBack}
        </Button>
      )}
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

// ── shared ──────────────────────────────────────────────────────────────────────

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

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1.5 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
