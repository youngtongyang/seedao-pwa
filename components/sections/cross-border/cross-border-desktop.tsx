"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Video } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/shared/section-heading";
import { useLocalized, useT } from "@/lib/i18n";
import { projectBenefits } from "@/lib/mock/cross-border";
import { PaymentSuccess } from "./payment-success";
import { PricingPanel } from "./pricing-panel";

export function CrossBorderDesktop() {
  const t = useT();
  const pick = useLocalized();
  const [paid, setPaid] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* ── Hero 区 ── */}
      <section className="mb-20">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* 左侧：文字 */}
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-block rounded-full bg-accent/10 px-3.5 py-1 text-sm font-medium text-accent">
              {t.crossBorder.eyebrow}
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight lg:text-5xl">
              {t.crossBorder.headline || t.crossBorder.title}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              {t.crossBorder.subtitle}
            </p>

            {/* 统计数据 */}
            <div className="mt-8 flex gap-8">
              <Stat icon={<Clock className="size-5" />} label={t.crossBorder.statDuration} />
              <Stat icon={<Video className="size-5" />} label={t.crossBorder.statSessions} />
            </div>
          </div>

          {/* 右侧：定价面板 */}
          <AnimatePresence mode="wait">
            {paid ? (
              <PaymentSuccess key="success" />
            ) : (
              <motion.div key="pricing" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                <PricingPanel onPaid={() => setPaid(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── 权益展示 ── */}
      <section>
        <SectionHeading
          eyebrow={null}
          title={t.crossBorder.benefitsTitle}
          subtitle={t.crossBorder.benefitsSubtitle}
          className="text-center"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projectBenefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

      {/* 底部间距 */}
      <div className="mt-24" />
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span className="text-accent">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
