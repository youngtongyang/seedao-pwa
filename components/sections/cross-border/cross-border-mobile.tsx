"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Video } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/shared/section-heading";
import { useLocalized, useT } from "@/lib/i18n";
import { projectBenefits } from "@/lib/mock/cross-border";
import { PaymentSuccess } from "./payment-success";
import { PricingPanel } from "./pricing-panel";

export function CrossBorderMobile() {
  const t = useT();
  const pick = useLocalized();
  const [paid, setPaid] = useState(false);

  return (
    <div className="px-4 py-10">
      {/* ── Hero 区 ── */}
      <section className="mb-12">
        <span className="mb-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {t.crossBorder.eyebrow}
        </span>
        <h1 className="text-3xl font-black leading-tight tracking-tight">
          {t.crossBorder.headline || t.crossBorder.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {t.crossBorder.subtitle}
        </p>

        {/* 统计数据 */}
        <div className="mt-6 flex gap-6">
          <Stat icon={<Clock className="size-4" />} label={t.crossBorder.statDuration} />
          <Stat icon={<Video className="size-4" />} label={t.crossBorder.statSessions} />
        </div>

        {/* 定价面板 */}
        <AnimatePresence mode="wait" initial={false}>
          {paid ? (
            <PaymentSuccess key="success" className="mt-8" />
          ) : (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <PricingPanel onPaid={() => setPaid(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── 权益展示 ── */}
      <section>
        <SectionHeading
          eyebrow={null}
          title={t.crossBorder.benefitsTitle}
          subtitle={t.crossBorder.benefitsSubtitle}
          className="text-center"
        />

        <div className="mt-8 space-y-4">
          {projectBenefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold">{pick(benefit.title)}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pick(benefit.desc)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-16" />
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
      <span className="text-accent">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
