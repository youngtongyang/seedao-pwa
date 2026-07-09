"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  ClipboardList,
  Copy,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { QRFrame } from "@/components/shared/qr-frame";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PaymentSuccess({
  className,
  orderNo,
  registrationFormUrl,
}: {
  className?: string;
  orderNo?: string;
  registrationFormUrl: string;
}) {
  const t = useT();
  const account = useAccount();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("rounded-3xl border border-border bg-card p-7", className)}
    >
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-success/10">
          <ShieldCheck className="size-8 text-success" />
        </div>
        <h3 className="text-2xl font-bold">{t.program.successTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t.program.successDesc}</p>
      </div>

      <div className="space-y-6">
        <SuccessStep
          icon={<Camera className="size-5" />}
          title={t.program.successScreenshotTitle}
          desc={
            <>
              <p>{t.program.successScreenshotDesc}</p>
              {orderNo && <OrderNoDisplay orderNo={orderNo} />}
            </>
          }
        />

        <SuccessStep
          icon={<MessageCircle className="size-5" />}
          title={t.program.successAssistantTitle}
          desc={
            <>
              <p>{t.program.successAssistantDesc}</p>
              <div className="mt-3 flex justify-start">
                <QRFrame src="/qr/wechat-help.png" alt={t.program.successAssistantQrAlt} size={140} withBadge={false} />
              </div>
            </>
          }
        />

        <SuccessStep
          icon={<ClipboardList className="size-5" />}
          title={t.program.successFormTitle}
          desc={
            <>
              <p>{t.program.successFormDesc}</p>
              <Button asChild size="sm" className="mt-2">
                <a href={registrationFormUrl} target="_blank" rel="noopener noreferrer">
                  {t.program.successFormCta}
                  <ExternalLink className="ml-1.5 size-3.5" />
                </a>
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">{t.program.successFormNote}</p>
            </>
          }
        />

        {!account.isMember && (
          <SuccessStep
            icon={<ShieldCheck className="size-5" />}
            title={t.program.successMemberTitle}
            desc={
              <>
                <p>{t.program.successMemberDesc}</p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/#membership">
                    {t.program.successMemberCta}
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </>
            }
          />
        )}
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="ghost">
          <Link href="/">{t.program.successBackHome}</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function SuccessStep({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-xl bg-muted/50 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function OrderNoDisplay({ orderNo }: { orderNo: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(orderNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [orderNo]);

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0">{t.program.orderNoLabel}</span>
      <code className="flex-1 text-xs font-mono truncate">{orderNo}</code>
      <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={handleCopy}>
        <Copy className="size-3.5" />
      </Button>
      {copied && <span className="text-xs text-success animate-in fade-in">{t.common.copied}</span>}
    </div>
  );
}
