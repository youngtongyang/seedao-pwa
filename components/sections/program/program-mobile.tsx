"use client";

import { Award, BookOpen, Calendar, Sparkles } from "lucide-react";
import Image from "next/image";
import { SectionHeading } from "@/components/shared/section-heading";
import { useLocalized, useT } from "@/lib/i18n";
import { instructor, schedule } from "@/lib/mock/program";
import { PricingPanel } from "./pricing-panel";

export function ProgramMobile() {
  const t = useT();
  const pick = useLocalized();

  const lessons = schedule.filter((s) => !s.isEvent);
  const events = schedule.filter((s) => s.isEvent);

  // 月份分组
  const julyItems = schedule.filter((s) => s.date.startsWith("7."));
  const augItems = schedule.filter((s) => s.date.startsWith("8."));

  return (
    <div className="px-4 py-8">
      {/* ── Hero ── */}
      <section className="mb-10">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="size-3" />
          {t.program.eyebrow}
        </span>
        <h1 className="text-2xl font-black leading-[1.2] tracking-tight">
          {t.program.headline || t.program.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.program.subtitle}</p>

        <div className="mt-5 flex gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2">
            <Calendar className="size-4 text-accent" />
            <span className="text-sm font-bold text-accent">30 天</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
            <BookOpen className="size-4 text-primary" />
            <span className="text-sm font-bold text-primary">9 节课</span>
          </div>
        </div>

        <div className="mt-8">
          <PricingPanel />
        </div>
      </section>

      {/* ── 讲师 ── */}
      <section className="mb-10">
        <SectionHeading eyebrow="讲师" title="谁来讲这门课？" subtitle="" className="text-center mb-6" />
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[3/2] w-full">
            <Image src={instructor.avatar} alt={instructor.name} fill className="object-cover" />
          </div>
          <div className="flex flex-col gap-3 p-5">
            <div>
              <h3 className="text-lg font-bold">{instructor.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{pick(instructor.title)}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 self-start rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
              <Award className="size-3.5" />
              {pick(instructor.highlight)}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{pick(instructor.bio)}</p>
          </div>
        </div>
      </section>

      {/* ── 课程表 ── */}
      <section>
        <SectionHeading
          eyebrow="课程表"
          title={`${lessons.length} 节正式课 + ${events.length} 场活动`}
          subtitle="7.25 开营 — 8.23 结营"
          className="text-center mb-6"
        />

        {/* 7 月 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent uppercase">7 月</span>
          </div>
          <div className="space-y-2">
            {julyItems.map((item) => (
              <ScheduleCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* 8 月 */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent uppercase">8 月</span>
          </div>
          <div className="space-y-2">
            {augItems.map((item) => (
              <ScheduleCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <div className="mt-16" />
    </div>
  );
}

function ScheduleCard({ item }: { item: (typeof schedule)[number] }) {
  return (
    <div className={`relative flex gap-3 overflow-hidden rounded-xl border px-4 py-3 ${item.isEvent ? "border-accent/20 bg-accent/5" : "border-border bg-card"}`}>
      {/* 左侧色条 */}
      <div className={`absolute left-0 top-0 h-full w-1 ${item.isEvent ? "bg-accent/50" : "bg-primary/40"}`} />

      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${item.isEvent ? "text-accent" : ""}`}>{item.date}</span>
          <span className="text-xs text-muted-foreground">{item.time}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              item.isEvent ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
            }`}
          >
            {item.isEvent ? "活动" : "课程"}
          </span>
        </div>
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        {item.content && (
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-xs text-muted-foreground">{item.content}</p>
          </div>
        )}
        {item.instructor && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/50">讲师</span> {item.instructor}
          </p>
        )}
      </div>
    </div>
  );
}
