"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  ClipboardList,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QRFrame } from "@/components/shared/qr-frame";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { crossBorderProject } from "@/lib/mock/cross-border";
import { cn } from "@/lib/utils";

export function PaymentSuccess({ className }: { className?: string }) {
  const t = useT();
  const account = useAccount();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("rounded-3xl border border-border bg-card p-7", className)}
    >
      {/* 标题 */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-success/10">
          <ShieldCheck className="size-8 text-success" />
        </div>
        <h3 className="text-2xl font-bold">{t.crossBorder.successTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.crossBorder.successDesc}
        </p>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-6">
        {/* ① 截图保存 */}
        <SuccessStep
          icon={<Camera className="size-5" />}
          title={t.crossBorder.successScreenshotTitle}
          desc={t.crossBorder.successScreenshotDesc}
        />

        {/* ② 添加小助手微信 */}
        <SuccessStep
          icon={<MessageCircle className="size-5" />}
          title={t.crossBorder.successAssistantTitle}
          desc={
            <>
              <p>{t.crossBorder.successAssistantDesc}</p>
              <div className="mt-3 flex justify-start">
                <QRFrame
                  src="/qr/wechat-help.png"
                  alt={t.crossBorder.successAssistantQrAlt}
                  size={140}
                  withBadge={false}
                />
              </div>
            </>
          }
        />

        {/* ③ 填写报名表 */}
        <SuccessStep
          icon={<ClipboardList className="size-5" />}
          title={t.crossBorder.successFormTitle}
          desc={
            <>
              <p>{t.crossBorder.successFormDesc}</p>
              <Button asChild size="sm" className="mt-2">
                <a
                  href={crossBorderProject.registrationFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.crossBorder.successFormCta}
                  <ExternalLink className="ml-1.5 size-3.5" />
                </a>
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.crossBorder.successFormNote}
              </p>
            </>
          }
        />

        {/* ④ 成为 SEEDAO 会员（仅非会员可见） */}
        {!account.isMember && (
          <SuccessStep
            icon={<ShieldCheck className="size-5" />}
            title={t.crossBorder.successMemberTitle}
            desc={
              <>
                <p>{t.crossBorder.successMemberDesc}</p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/#membership">
                    {t.crossBorder.successMemberCta}
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </>
            }
          />
        )}
      </div>

      {/* 返回首页 */}
      <div className="mt-8 text-center">
        <Button asChild variant="ghost">
          <Link href="/">{t.crossBorder.successBackHome}</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function SuccessStep({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-xl bg-muted/50 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
