"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Info } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { QRFrame } from "@/components/shared/qr-frame";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { membershipPrice } from "@/lib/mock/membership";
import { cn } from "@/lib/utils";

export function PaymentPanel({ className }: { className?: string }) {
  const t = useT();

  /** The step currently shown (1-3) and the furthest step unlocked so far. */
  const [current, setCurrent] = useState(1);
  const [maxUnlocked, setMaxUnlocked] = useState(1);

  const steps = [t.membership.step1Short, t.membership.step2Short, t.membership.step3Short];

  /** Advance: unlock the next step and reveal it. */
  function advanceTo(step: number) {
    setMaxUnlocked((m) => Math.max(m, step));
    setCurrent(step);
  }

  /** Jump via the breadcrumb — only to steps already unlocked. */
  function goTo(step: number) {
    if (step <= maxUnlocked) setCurrent(step);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-border bg-card p-7",
        className,
      )}
    >
      <div className="flex items-end justify-center gap-1">
        <span className="text-2xl font-semibold text-muted-foreground">
          {t.membership.currency}
        </span>
        <span className="text-5xl font-black tracking-tight">
          {membershipPrice.amount}
        </span>
        <span className="mb-1.5 text-sm text-muted-foreground">
          {t.membership.perYear}
        </span>
      </div>
      <p className="-mt-4 text-center text-sm text-muted-foreground">
        {t.membership.priceLabel}
      </p>

      {/* ── Breadcrumb stepper ─────────────────────────────────────────── */}
      <nav aria-label={t.membership.howTitle}>
        <ol className="flex items-start">
          {steps.map((label, i) => {
            const step = i + 1;
            const reachable = step <= maxUnlocked;
            const isCurrent = step === current;
            const isDone = step < maxUnlocked;
            return (
              <Fragment key={step}>
                <li className="flex w-0 flex-1 flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => goTo(step)}
                    disabled={!reachable}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : reachable
                            ? "border-primary/40 text-primary hover:bg-primary/5"
                            : "border-border text-muted-foreground",
                      reachable ? "cursor-pointer" : "cursor-not-allowed",
                    )}
                  >
                    {isDone ? <Check className="size-4" /> : step}
                  </button>
                  <span
                    className={cn(
                      "text-center text-xs leading-tight",
                      isCurrent
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </li>
                {i < steps.length - 1 && (
                  <li
                    aria-hidden
                    className={cn(
                      "mt-4 h-0.5 flex-1 rounded-full transition-colors",
                      step < maxUnlocked ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>

      {/* ── Active step ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 text-center"
        >
          {current === 1 && (
            <>
              <StepHeading title={t.membership.step1Title} desc={t.membership.step1Desc} />
              <QRFrame
                src="/qr/wechat-pay.svg"
                alt={t.membership.payQrAlt}
                size={172}
              />
              <Button size="lg" className="w-full" onClick={() => advanceTo(2)}>
                {t.membership.step1Cta}
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}

          {current === 2 && (
            <>
              <StepHeading title={t.membership.step2Title} desc={t.membership.step2Desc} />
              <QRFrame
                src="/qr/wechat-help.svg"
                alt={t.membership.assistantQrAlt}
                size={172}
                withBadge={false}
              />
              <Button size="lg" className="w-full" onClick={() => advanceTo(3)}>
                {t.membership.step2Cta}
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}

          {current === 3 && (
            <>
              <StepHeading title={t.membership.step3Title} desc={t.membership.step3Desc} />
              <p className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-left text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                {t.membership.delegatedNote}
              </p>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link href="/login">
                  {t.membership.afterPayCta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
