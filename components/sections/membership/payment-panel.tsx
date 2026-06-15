"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  LogIn,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { QRFrame } from "@/components/shared/qr-frame";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { membershipPrice } from "@/lib/mock/membership";
import { paymentProvider } from "@/lib/payment";
import { cn } from "@/lib/utils";

export function PaymentPanel({ className }: { className?: string }) {
  const t = useT();
  const account = useAccount();
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);
    try {
      const order = await paymentProvider.createOrder({
        amount: membershipPrice.amount,
      });
      const result = await paymentProvider.confirmPayment(order.id);
      if (result.status === "paid") account.activateMembership();
    } finally {
      setPaying(false);
    }
  }

  const isMember = account.hydrated && account.isMember;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-7 text-center",
        className,
      )}
    >
      {isMember ? (
        <motion.div
          key="paid"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 className="size-9" />
          </span>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold">{t.membership.paidTitle}</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t.membership.paidDesc}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <Button asChild className="w-full">
              <Link href="/login">
                <LogIn className="size-4" />
                {t.membership.paidCtaLogin}
              </Link>
            </Button>
          </div>
          <button
            type="button"
            onClick={account.reset}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            {t.membership.resetDemo}
          </button>
        </motion.div>
      ) : (
        <>
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
          <p className="-mt-3 text-sm text-muted-foreground">
            {t.membership.priceLabel}
          </p>

          <QRFrame
            src="/qr/wechat-pay.svg"
            alt={t.membership.payTitle}
            size={184}
          />

          <div className="space-y-1">
            <p className="font-semibold">{t.membership.payTitle}</p>
            <p className="text-sm text-muted-foreground">{t.membership.payHint}</p>
          </div>

          <Button
            onClick={handlePay}
            disabled={paying}
            size="lg"
            className="w-full"
          >
            {paying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t.membership.paying}
              </>
            ) : (
              t.membership.payCta
            )}
          </Button>

          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t.membership.payNote}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-success" />
              {t.membership.securedBy}
            </span>
            <span>·</span>
            <span>{t.membership.guarantee}</span>
          </div>
        </>
      )}
    </div>
  );
}
