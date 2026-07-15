"use client";

import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { QRFrame } from "@/components/shared/qr-frame";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { programPricing } from "@/lib/mock/program";

const { basePrice, earlyBirdPrice, memberDiscountRate } = programPricing;

export function PricingPanel() {
  const t = useT();
  const account = useAccount();

  const isMember = account.isMember;
  const finalPrice = isMember ? Math.round(earlyBirdPrice * memberDiscountRate) : earlyBirdPrice;
  const memberPrice = Math.round(earlyBirdPrice * memberDiscountRate);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-7">
      <h3 className="text-center text-xl font-bold">{t.program.pricingTitle}</h3>

      <div className="space-y-4">
        <div className="flex items-end justify-center gap-1">
          <span className="text-2xl font-semibold text-muted-foreground">¥</span>
          <span className="text-5xl font-black tracking-tight">{finalPrice}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="line-through">¥{basePrice}</span>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            早鸟 -¥{basePrice - earlyBirdPrice}
          </span>
        </div>

        {isMember ? (
          <div className="flex items-start gap-2 rounded-xl bg-accent/8 px-3.5 py-3 text-sm text-accent-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
            <div>
              <p className="font-medium">{t.program.pricingMemberBadge}</p>
              <p className="text-xs text-muted-foreground">{t.program.pricingMemberNote}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="space-y-1.5">
              <p className="font-medium">
                会员价 <span className="text-accent">¥{memberPrice}</span>，{t.program.pricingNotMemberDesc}
              </p>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                <Link href="/#membership">
                  {t.program.pricingNotMemberCta}
                  <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 py-4">
        <p className="text-sm font-medium">添加小助手微信完成支付</p>
        <QRFrame src="/qr/ai_aide.png" alt="小助手微信二维码" size={160} withBadge={false} />
        <p className="text-xs text-muted-foreground">微信扫一扫，私聊小助手转账</p>
        {isMember && (
          <p className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            请按会员价 ¥{memberPrice} 支付
          </p>
        )}
      </div>
    </div>
  );
}
