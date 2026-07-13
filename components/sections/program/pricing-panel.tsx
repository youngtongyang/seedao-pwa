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
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAccount } from "@/lib/account";
import { joinHref, loginHref, returnToForPayment } from "@/lib/auth/return-to";
import {
  clearPendingCoursePay,
  readPendingCoursePay,
  savePendingCoursePay,
} from "@/lib/course/pending-pay";
import {
  closeCourseOrder,
  createCourseOrder,
  previewCheckout,
  queryCourseOrder,
  readCourseOrderNo,
} from "@/lib/course/client";
import type { CheckoutPreviewResult, CourseOrder, PayChannel } from "@/lib/course/types";
import { useT } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/messages";
import type { Program } from "@/lib/mock/programs";
import {
  courseDefaultPayChannel,
  isH5PayChannel,
  isMobileDevice,
  navigateToPayment,
  openPaymentRedirect,
} from "@/lib/payment/client";
import { paymentRedirectUrl } from "@/lib/payment/types";

const POLL_INTERVAL_MS = 3000;
// 客户端轮询超时只做兜底（服务端 paid/closed 状态始终优先），预算按本地时钟的
// 流逝时间计——直接对比 Date.now() 与服务端 expired_at 会被设备时钟偏差误杀。
const POLL_MIN_BUDGET_MS = 2 * 60 * 1000;
const POLL_MAX_BUDGET_MS = 15 * 60 * 1000;

/** 格式化金额（元），整数不显示小数位，如 299；非整数保留 2 位，如 0.30 */
function fmtYuan(yuan: number): string {
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

/** 机器错误码 → 本地化文案；查不到的错误码回退到 fallback */
function localizeError(t: Messages, key: string | undefined, fallback: string): string {
  if (!key) return fallback;
  const program = t.program.errors as Record<string, string>;
  const login = t.login.errors as Record<string, string>;
  return program[key] ?? login[key] ?? fallback;
}

type PayPhase = "idle" | "creating" | "waiting" | "h5Ready" | "confirming" | "paid" | "error";

/** 一次试算请求的结果，连同它所回答的请求 key（用于识别在途请求与过期结果） */
type PreviewState =
  | { status: "ok"; data: CheckoutPreviewResult; key: string }
  | { status: "error"; errorKey?: string; key: string };

export function PricingPanel({ program, onPaid }: { program: Program; onPaid: (orderNo: string) => void }) {
  const t = useT();
  const account = useAccount();
  const { courseId, skuId } = program;
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const [channelCode, setChannelCode] = useState<string | undefined>(undefined);
  const [payErrorKey, setPayErrorKey] = useState<string | undefined>(undefined);
  const [order, setOrder] = useState<CourseOrder | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const mobile = isMobileDevice();

  // ── 课程价格试算：等会员态水合后再请求（避免水合前后重复预检）；
  //    会员态或渠道码变化时按新身份重算，失败时不保留旧价格 ──
  const requestKey = account.hydrated
    ? JSON.stringify([previewAttempt, account.isMember, channelCode ?? null, courseId, skuId])
    : null;

  useEffect(() => {
    if (requestKey === null) return;
    let stale = false;
    previewCheckout({
      course_id: courseId,
      sku_id: skuId,
      channel_code: channelCode,
      apply_member_discount: account.isMember,
    }).then((outcome) => {
      if (stale) return;
      setPreviewState(
        outcome.ok
          ? { status: "ok", data: outcome.data, key: requestKey }
          : { status: "error", errorKey: outcome.error, key: requestKey },
      );
    });
    return () => {
      stale = true;
    };
  }, [requestKey, account.isMember, channelCode, courseId, skuId]);

  const retryPreview = useCallback(() => {
    setPreviewAttempt((n) => n + 1);
  }, []);

  const applyPromo = useCallback((code: string) => {
    setChannelCode(code || undefined);
  }, []);

  const preview = previewState?.status === "ok" ? previewState.data : null;
  const previewErrorKey = previewState?.status === "error" ? previewState.errorKey : undefined;
  const previewFailed = previewState?.status === "error";
  const previewFetching = requestKey !== null && previewState?.key !== requestKey;

  // ── 实付金额（分 → 元）──
  const finalPriceYuan = preview ? preview.final_amount / 100 : null;
  const originalPriceYuan = preview ? preview.original_amount / 100 : null;
  const amountIfMemberYuan = preview?.amount_if_member ? preview.amount_if_member / 100 : null;

  // ── 渠道码状态：以试算返回的 discounts 为准，保证展示价与下单价一致 ──
  const channelDiscount = preview?.discounts?.find((d) => d.type === "channel");
  const appliedChannelCode = channelDiscount?.applied ? channelCode : undefined;
  const promoDeductionYuan = channelDiscount?.applied ? channelDiscount.amount / 100 : null;
  const promoInvalid = !!channelCode && !previewFetching && !!preview && !channelDiscount?.applied;

  // ── 创建订单 & 打开 QR ──
  const startPay = useCallback(
    (channel: PayChannel) => {
      setPayErrorKey(undefined);
      setPhase("creating");
      createCourseOrder({
        course_id: courseId,
        sku_id: skuId,
        channel_code: appliedChannelCode,
        apply_member_discount: account.isMember,
        pay_channel: channel,
        return_to: returnToForPayment(`/program/${program.slug}`),
      }).then((outcome) => {
        if (outcome.ok) {
          setOrder(outcome.data);
          const redirectUrl = paymentRedirectUrl(outcome.data);
          if (isH5PayChannel(channel) && redirectUrl) {
            savePendingCoursePay(outcome.data.order_no, program.slug);
            navigateToPayment(redirectUrl);
            return;
          }
          setPhase("waiting");
          setQrOpen(true);
        } else {
          setPayErrorKey(outcome.error);
          setPhase("error");
        }
      });
    },
    [account.isMember, appliedChannelCode, courseId, program.slug, skuId],
  );

  const handoff = useCallback(() => {
    const url = order ? paymentRedirectUrl(order) : undefined;
    if (!url) return;
    setPhase("confirming");
    openPaymentRedirect(url);
  }, [order]);

  const cancelPay = useCallback(() => {
    const abandoned = order;
    setQrOpen(false);
    setOrder(null);
    setPhase("idle");
    clearPendingCoursePay();
    if (abandoned) void closeCourseOrder(abandoned.order_no);
  }, [order]);

  // Resume polling after an H5 round-trip back to this program page.
  useEffect(() => {
    let disposed = false;
    const pending = readPendingCoursePay();
    const orderNo =
      readCourseOrderNo(courseId) ??
      (pending?.slug === program.slug ? pending.order_no : undefined);
    if (!orderNo) return;

    void queryCourseOrder(orderNo).then((r) => {
      if (disposed || !r.ok) return;
      if (r.data.status === "paid") {
        clearPendingCoursePay();
        onPaid(orderNo);
        return;
      }
      if (r.data.status === "pending") {
        setOrder({
          order_no: orderNo,
          product_type: "course_purchase",
          course_id: courseId,
          sku_id: skuId,
          original_amount: 0,
          discount_amount: 0,
          amount: r.data.amount,
          status: "pending",
        });
        setPhase("confirming");
      }
    });

    return () => {
      disposed = true;
    };
  }, [courseId, onPaid, program.slug, skuId]);

  // ── 轮询支付状态：订单被关闭或超出轮询预算时终止并提示重新发起 ──
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const deadlineRef = useRef<{ orderNo: string; deadline: number } | null>(null);
  useEffect(() => {
    if ((phase !== "waiting" && phase !== "h5Ready" && phase !== "confirming") || !order) return;
    let disposed = false;
    let settled = false;
    // 截止时间按订单锚定：effect 因父级重渲染重建时不重置轮询预算
    if (deadlineRef.current?.orderNo !== order.order_no) {
      const ttlMs = order.expired_at ? Date.parse(order.expired_at) - Date.now() : Number.NaN;
      const budgetMs = Number.isNaN(ttlMs)
        ? POLL_MAX_BUDGET_MS
        : Math.min(Math.max(ttlMs, POLL_MIN_BUDGET_MS), POLL_MAX_BUDGET_MS);
      deadlineRef.current = { orderNo: order.order_no, deadline: Date.now() + budgetMs };
    }
    const deadline = deadlineRef.current.deadline;
    const stop = () => {
      settled = true;
      clearInterval(pollRef.current);
    };
    const expire = () => {
      stop();
      setQrOpen(false);
      setOrder(null);
      setPayErrorKey("course_order_expired");
      setPhase("error");
      void closeCourseOrder(order.order_no);
    };
    pollRef.current = setInterval(() => {
      queryCourseOrder(order.order_no).then((r) => {
        if (disposed || settled) return;
        // 已支付优先于本地超时判定，避免在到期边界把已付款用户判为过期
        if (r.ok && r.data.status === "paid") {
          stop();
          setQrOpen(false);
          clearPendingCoursePay();
          setPhase("paid");
          onPaid(order.order_no);
          return;
        }
        if ((r.ok && r.data.status === "closed") || Date.now() > deadline) {
          expire();
        }
      });
    }, POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      clearInterval(pollRef.current);
    };
  }, [phase, order, onPaid]);

  // ── 加载态 / 试算失败 ──
  if (!preview) {
    if (previewFetching || !previewFailed) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-7">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-7">
        <p className="text-sm text-destructive">
          {localizeError(t, previewErrorKey, t.program.priceComputeError)}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={retryPreview}>{t.common.retry}</Button>
          {/* 渠道码可能正是试算失败的原因；提供移除入口，避免困在错误卡里反复重试 */}
          {channelCode && (
            <Button variant="ghost" size="sm" onClick={() => setChannelCode(undefined)}>
              {t.program.promoRemoveRetry}
            </Button>
          )}
        </div>
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
            returnTo={`/program/${program.slug}`}
          />
        )}
      </div>

      {phase === "idle" && (
        <>
          <PromoCodeField
            appliedCode={channelCode}
            onApply={applyPromo}
            validating={!!channelCode && previewFetching}
            appliedDeductionYuan={promoDeductionYuan}
            invalid={promoInvalid}
            disabled={previewFetching}
          />
          <Button
            size="lg"
            className="w-full text-base"
            onClick={() => startPay(courseDefaultPayChannel())}
            disabled={previewFetching}
          >
            {finalPriceYuan !== null
              ? `${mobile ? t.program.payCtaWechat : t.program.payCta} ¥${fmtYuan(finalPriceYuan)}`
              : (mobile ? t.program.payCtaWechat : t.program.payCta)}
            {previewFetching
              ? <Loader2 className="size-4 animate-spin" />
              : <ArrowRight className="size-4" />}
          </Button>
        </>
      )}

      {(phase === "creating" || phase === "waiting" || phase === "confirming") && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-muted p-5 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {phase === "creating" ? t.program.payCreating : t.program.payWaiting}
          </p>
          {phase === "waiting" && !qrOpen && (
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
                {t.program.qrReopen}
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelPay}>
                {t.program.qrDialogCancel}
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "h5Ready" && order && paymentRedirectUrl(order) && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-muted p-5 text-center">
          <Button size="lg" className="w-full" onClick={handoff}>
            {t.program.payH5CtaWechat}
          </Button>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t.program.payWaiting}
          </p>
          <Button variant="ghost" size="sm" onClick={cancelPay}>
            {t.program.qrDialogCancel}
          </Button>
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
          <p className="text-sm text-destructive">
            {localizeError(t, payErrorKey, t.program.payError)}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {payErrorKey === "course_member_login_required" && (
              <Button asChild size="sm">
                <Link href={loginHref(`/program/${program.slug}`)}>{t.nav.login}</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setPhase("idle")}>{t.common.retry}</Button>
          </div>
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

// ── PromoCodeField ──────────────────────────────────────────────────────────────

function PromoCodeField({
  appliedCode,
  onApply,
  validating,
  appliedDeductionYuan,
  invalid,
  disabled,
}: {
  appliedCode?: string;
  onApply: (code: string) => void;
  validating: boolean;
  appliedDeductionYuan: number | null;
  invalid: boolean;
  disabled: boolean;
}) {
  const t = useT();
  // 初值取当前生效的渠道码：字段随支付阶段卸载重挂时不与已生效状态脱节
  const [value, setValue] = useState(appliedCode ?? "");

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{t.program.promoLabel}</p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.program.promoPlaceholder}
          disabled={disabled}
          className="h-10"
        />
        <Button
          variant="outline"
          className="h-10 shrink-0"
          onClick={() => onApply(value.trim())}
          disabled={disabled || validating}
        >
          {validating ? t.program.promoValidating : t.program.promoApply}
        </Button>
      </div>
      {appliedDeductionYuan !== null && (
        <p className="text-xs text-success">
          {t.program.promoValid.replace("{deduction}", fmtYuan(appliedDeductionYuan))}
        </p>
      )}
      {invalid && <p className="text-xs text-destructive">{t.program.promoInvalid}</p>}
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
  returnTo,
}: {
  amountIfMemberYuan: number | null;
  memberHint?: string;
  returnTo: string;
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
          <Link href={joinHref(returnTo)}>
            {t.program.pricingNotMemberCta}
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
