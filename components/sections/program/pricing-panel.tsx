"use client";

import {
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAccount } from "@/lib/account";
import { previewCheckout, createCourseOrder, queryCourseOrder } from "@/lib/course/client";
import type { CheckoutPreviewResult, CourseOrder } from "@/lib/course/types";
import { useT } from "@/lib/i18n";
import { programProject } from "@/lib/mock/program";

const POLL_INTERVAL_MS = 3000;
const { courseId, skuId } = programProject;

/** 格式化金额（元），整数不显示小数位，如 299；非整数保留 2 位，如 0.30 */
function fmtYuan(yuan: number): string {
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

type PayPhase = "idle" | "creating" | "waiting" | "paid" | "error";

export function PricingPanel({ onPaid }: { onPaid: (orderNo: string) => void }) {
  const t = useT();
  const account = useAccount();
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [preview, setPreview] = useState<CheckoutPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [order, setOrder] = useState<CourseOrder | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  // ── 首次加载：课程价格试算（无渠道码）──
  const loadPreview = useCallback(() => {
    setPreviewLoading(true);
    setPreviewError(null);
    previewCheckout({
      course_id: courseId,
      sku_id: skuId,
      apply_member_discount: account.isMember,
    }).then((outcome) => {
      setPreviewLoading(false);
      if (outcome.ok) {
        setPreview(outcome.data);
      } else {
        setPreviewError(outcome.error ?? t.program.priceComputeError);
      }
    });
  }, [t]);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadPreview();
  }, [loadPreview]);

  // ── 实付金额（分 → 元）──
  const finalPriceYuan = preview ? preview.final_amount / 100 : null;
  const originalPriceYuan = preview ? preview.original_amount / 100 : null;
  const amountIfMemberYuan = preview?.amount_if_member ? preview.amount_if_member / 100 : null;

  // ── 创建订单 & 打开 QR ──
  const handlePay = useCallback(() => {
    setPhase("creating");
    createCourseOrder({
      course_id: courseId,
      sku_id: skuId,
      apply_member_discount: account.isMember,
      pay_channel: "wechat_native",
    }).then((outcome) => {
      if (outcome.ok) {
        setOrder(outcome.data);
        setPhase("waiting");
        setQrOpen(true);
      } else {
        setPhase("error");
      }
    });
  }, [account.isMember]);

  // ── 轮询支付状态 ──
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (phase !== "waiting" || !order) return;
    pollRef.current = setInterval(() => {
      queryCourseOrder(order.order_no).then((r) => {
        if (r.ok && r.data.status === "paid") {
          clearInterval(pollRef.current);
          setPhase("paid");
          setQrOpen(false);
          onPaid(order.order_no);
        }
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [phase, order, onPaid]);

  // ── 加载态 ──
  if (previewLoading && !preview) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-7">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  if (previewError && !preview) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-7">
        <p className="text-sm text-destructive">{previewError}</p>
        <Button variant="outline" size="sm" onClick={loadPreview}>{t.common.retry}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-7">
      <h3 className="text-center text-xl font-bold">{t.program.pricingTitle}</h3>

      <div className="space-y-3">
        <PriceDisplay
          finalPriceYuan={finalPriceYuan}
          originalPriceYuan={originalPriceYuan}
          preview={preview}
        />

        {preview?.member_discount?.applied ? <MemberDiscountNote /> : (
          <MemberRegisterPrompt
            amountIfMemberYuan={amountIfMemberYuan}
            memberHint={preview?.member_discount?.hint}
          />
        )}
      </div>

      {phase === "idle" && (
        <Button size="lg" className="w-full text-base" onClick={handlePay}>
          {finalPriceYuan !== null ? `${t.program.payCta} ¥${fmtYuan(finalPriceYuan)}` : t.program.payCta}
          <ArrowRight className="size-4" />
        </Button>
      )}

      {(phase === "creating" || phase === "waiting") && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-muted p-5 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {phase === "creating" ? t.program.payCreating : t.program.payWaiting}
          </p>
        </div>
      )}

      {phase === "paid" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-success/10 p-5 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <p className="text-lg font-bold text-success">{t.program.paySuccess}</p>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-destructive/10 p-5 text-center">
          <XCircle className="size-10 text-destructive" />
          <p className="text-sm text-destructive">{t.program.payError || "订单创建失败"}</p>
          <Button variant="outline" size="sm" onClick={() => setPhase("idle")}>{t.common.retry}</Button>
        </div>
      )}

      {/* QR 弹层 */}
      <Sheet open={qrOpen} onOpenChange={setQrOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <div className="space-y-2 text-center">
            <SheetTitle>{t.program.qrDialogTitle}</SheetTitle>
            <SheetDescription>{t.program.qrDialogHint}</SheetDescription>
          </div>
          <div className="flex flex-col items-center gap-6 py-8">
            {order?.code_url && (
              <QrCode value={order.code_url} alt={t.program.payQrAlt} size={180} />
            )}
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t.program.payWaiting}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── PriceDisplay ────────────────────────────────────────────────────────────────

function PriceDisplay({
  finalPriceYuan,
  originalPriceYuan,
  preview,
}: {
  finalPriceYuan: number | null;
  originalPriceYuan: number | null;
  preview: CheckoutPreviewResult | null;
}) {
  const price = finalPriceYuan ?? 0;
  const original = originalPriceYuan ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-center gap-1">
        <span className="text-2xl font-semibold text-muted-foreground">¥</span>
        <span className="text-5xl font-black tracking-tight">{fmtYuan(price)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="line-through">¥{fmtYuan(original)}</span>

        {/* 折扣标签来自服务端 discounts */}
        {(preview?.discounts ?? [])
          .filter((d) => d.applied)
          .map((d) => (
            <span
              key={d.type}
              className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
            >
              {d.label} -¥{fmtYuan(d.amount / 100)}
            </span>
          ))}
      </div>
    </div>
  );
}

// ── Member notes ────────────────────────────────────────────────────────────────

function MemberDiscountNote() {
  const t = useT();
  return (
    <div className="flex items-start gap-2 rounded-xl bg-accent/8 px-3.5 py-3 text-sm text-accent-foreground">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
      <div>
        <p className="font-medium">{t.program.pricingMemberBadge}</p>
        <p className="text-xs text-muted-foreground">{t.program.pricingMemberNote}</p>
      </div>
    </div>
  );
}

function MemberRegisterPrompt({
  amountIfMemberYuan,
  memberHint,
}: {
  amountIfMemberYuan: number | null;
  memberHint?: string;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="space-y-1.5">
        {amountIfMemberYuan !== null && (
          <p className="font-medium">
            会员价 <span className="text-accent">¥{fmtYuan(amountIfMemberYuan)}</span>，{t.program.pricingNotMemberDesc}
          </p>
        )}
        {memberHint && (
          <p className="text-xs text-muted-foreground">{memberHint}</p>
        )}
        <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
          <Link href="/#membership">
            {t.program.pricingNotMemberCta}
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
