"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  Ticket,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAccount } from "@/lib/account";
import { computePrice, type PriceBreakdown } from "@/lib/cross-border/pricing";
import { previewCouponCode } from "@/lib/payment/client";
import { useT } from "@/lib/i18n";
import { crossBorderPricing } from "@/lib/mock/cross-border";

/** 支付流程阶段 */
type PayPhase = "idle" | "paying" | "paid";

/** 优惠码状态 */
type PromoState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "valid"; code: string; deduction: number }
  | { status: "invalid" };

export function PricingPanel({ onPaid }: { onPaid: () => void }) {
  const t = useT();
  const account = useAccount();
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [promoState, setPromoState] = useState<PromoState>({ status: "idle" });
  const [promoInput, setPromoInput] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  // 打开 Sheet 时生成新二维码 URL（避免渲染期调用 Date.now()）
  const handleOpenQr = useCallback(() => {
    setQrUrl(`weixin://wxpay/bizpayurl?pr=crossborder_${Date.now()}`);
    setQrOpen(true);
  }, []);

  // 价格明细
  const promoValid = promoState.status === "valid";
  const price = useMemo(
    () => computePrice(account.isMember, promoValid),
    [account.isMember, promoValid],
  );

  // 优惠码验证 — 统一走真实 API（BFF → 后端 /v1/payments/coupons/preview）
  const handleApplyPromo = useCallback(() => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoState({ status: "validating" });

    previewCouponCode(code).then((outcome) => {
      if (outcome.ok && outcome.data.discount_amount > 0) {
        setPromoState({
          status: "valid",
          code: outcome.data.coupon_code,
          deduction: Math.round(outcome.data.discount_amount / 100), // 分 → 元
        });
      } else {
        setPromoState({ status: "invalid" });
      }
    });
  }, [promoInput]);

  const handleClearPromo = useCallback(() => {
    setPromoState({ status: "idle" });
    setPromoInput("");
  }, []);

  // 模拟支付
  const handleSimulatePay = useCallback(() => {
    setQrOpen(false);
    setPhase("paid");
    onPaid();
  }, [onPaid]);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-7">
      <h3 className="text-center text-xl font-bold">{t.crossBorder.pricingTitle}</h3>

      {/* ── 价格展示 ── */}
      <div className="space-y-3">
        {/* 原价 + 折扣明细 */}
        <PriceDisplay price={price} />

        {/* SEEDAO 会员折扣提示 */}
        {account.isMember ? (
          <MemberDiscountNote />
        ) : (
          <MemberRegisterPrompt />
        )}
      </div>

      {/* ── 优惠码 ── */}
      <PromoCodeInput
        input={promoInput}
        onInputChange={setPromoInput}
        state={promoState}
        onApply={handleApplyPromo}
        onClear={handleClearPromo}
        disabled={phase !== "idle"}
      />

      {/* ── 支付按钮 ── */}
      {phase === "idle" && (
        <Button
          size="lg"
          className="w-full text-base"
          onClick={handleOpenQr}
        >
          {t.crossBorder.payCta}
          <ArrowRight className="size-4" />
        </Button>
      )}

      {phase === "paid" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-success/10 p-5 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <p className="text-lg font-bold text-success">{t.crossBorder.paySuccess}</p>
        </div>
      )}

      {/* ── 支付二维码弹层 ── */}
      <Sheet open={qrOpen} onOpenChange={setQrOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <div className="space-y-2 text-center">
            <SheetTitle>{t.crossBorder.qrDialogTitle}</SheetTitle>
            <SheetDescription>{t.crossBorder.qrDialogHint}</SheetDescription>
          </div>
          <div className="flex flex-col items-center gap-6 py-8">
            <QrCode
              value={qrUrl}
              alt={t.crossBorder.payQrAlt}
              size={180}
            />
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t.crossBorder.payWaiting}
            </p>

            <div className="flex w-full flex-col gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSimulatePay}
              >
                {t.crossBorder.qrDialogSimulate}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setQrOpen(false)}
              >
                {t.crossBorder.qrDialogCancel}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** 价格明细展示 */
function PriceDisplay({ price }: { price: PriceBreakdown }) {
  const t = useT();
  const { currency } = crossBorderPricing;

  return (
    <div className="space-y-2">
      {/* 最终价 */}
      <div className="flex items-end justify-center gap-1">
        <span className="text-2xl font-semibold text-muted-foreground">
          {currency}
        </span>
        <span className="text-5xl font-black tracking-tight">
          {price.finalPrice}
        </span>
      </div>

      {/* 原价划线 + 早鸟价 + 折扣标签 */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        {/* 始终显示原价划线 */}
        <span className="line-through">
          {t.crossBorder.payAmount(price.basePrice)}
        </span>

        {/* 早鸟价标签 + 节省金额 */}
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          {t.crossBorder.pricingEarlyBird}
        </span>
        <span className="text-xs text-success">
          {t.crossBorder.pricingYouSave.replace(
            "{amount}",
            String(price.earlyBirdSaving),
          )}
        </span>

        {/* 会员折扣标签 */}
        {price.isMember && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            会员 8 折
          </span>
        )}

        {/* 优惠码标签 */}
        {price.promoApplied && (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            优惠码 -¥{price.promoDeduction}
          </span>
        )}
      </div>
    </div>
  );
}

/** SEEDAO 会员折扣提示 */
function MemberDiscountNote() {
  const t = useT();
  return (
    <div className="flex items-start gap-2 rounded-xl bg-accent/8 px-3.5 py-3 text-sm text-accent-foreground">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
      <div>
        <p className="font-medium">{t.crossBorder.pricingMemberBadge}</p>
        <p className="text-xs text-muted-foreground">
          {t.crossBorder.pricingMemberNote}
        </p>
      </div>
    </div>
  );
}

/** 非会员引导注册 SEEDAO */
function MemberRegisterPrompt() {
  const t = useT();
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="space-y-1.5">
        <p className="text-muted-foreground">{t.crossBorder.pricingNotMemberDesc}</p>
        <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
          <Link href="/#membership">
            {t.crossBorder.pricingNotMemberCta}
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** 优惠码输入区 */
function PromoCodeInput({
  input,
  onInputChange,
  state,
  onApply,
  onClear,
  disabled,
}: {
  input: string;
  onInputChange: (v: string) => void;
  state: PromoState;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const t = useT();

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Ticket className="size-3.5" />
        {t.crossBorder.promoLabel}
      </Label>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => {
            onInputChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20));
            if (state.status === "valid" || state.status === "invalid") {
              onClear();
            }
          }}
          placeholder={t.crossBorder.promoPlaceholder}
          className="font-mono tracking-wider"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") onApply();
          }}
        />

        {state.status === "valid" ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={disabled}
          >
            <XCircle className="size-5 text-muted-foreground" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onApply}
            disabled={disabled || !input.trim() || state.status === "validating"}
          >
            {state.status === "validating" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t.crossBorder.promoApply
            )}
          </Button>
        )}
      </div>

      {/* 验证状态反馈 */}
      <AnimatePresence mode="wait">
        {state.status === "valid" && (
          <motion.p
            key="valid"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-success"
          >
            <CheckCircle2 className="size-3.5" />
            {t.crossBorder.promoValid.replace("{deduction}", String(state.deduction))}
          </motion.p>
        )}
        {state.status === "invalid" && (
          <motion.p
            key="invalid"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <XCircle className="size-3.5" />
            {t.crossBorder.promoInvalid}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
