"use client";

import { Award, BookOpen, Calendar, Sparkles } from "lucide-react";
import Image from "next/image";
import { SectionHeading } from "@/components/shared/section-heading";
import { useLocalized, useT } from "@/lib/i18n";
import { instructor, schedule } from "@/lib/mock/program";
import { PricingPanel } from "./pricing-panel";

export function ProgramDesktop() {
  const t = useT();
  const pick = useLocalized();

  const lessons = schedule.filter((s) => !s.isEvent);
  const events = schedule.filter((s) => s.isEvent);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* ── Hero ── */}
      <section className="mb-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              <Sparkles className="size-3.5" />
              {t.program.eyebrow}
            </span>
            <h1 className="max-w-lg text-4xl font-black leading-[1.15] tracking-tight lg:text-5xl">
              {t.program.headline}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">{t.program.subtitle}</p>
            <div className="mt-8 flex gap-10">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Calendar className="size-6" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">30</p>
                  <p className="text-xs text-muted-foreground">天</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-6" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">9</p>
                  <p className="text-xs text-muted-foreground">节课</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:mt-0">
            <PricingPanel />
          </div>
        </div>
      </section>

      {/* ── 讲师 ── */}
      <section className="mb-24">
        <SectionHeading eyebrow="讲师" title="谁来讲这门课？" subtitle="" className="text-center mb-12" />
        <div className="flex flex-col items-center gap-10 rounded-3xl border border-border bg-card p-12 md:flex-row md:items-start">
          <div className="relative size-64 shrink-0 overflow-hidden rounded-2xl shadow-xl ring-4 ring-border/50">
            <Image src={instructor.avatar} alt={instructor.name} fill className="object-cover" />
          </div>
          <div className="flex flex-col gap-4 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-bold">{instructor.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pick(instructor.title)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
                <Award className="size-4" />
                {pick(instructor.highlight)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                10+ 年开发经验
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                远程独立开发者
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{pick(instructor.bio)}</p>
          </div>
        </div>
      </section>

      {/* ── 课程表 ── */}
      <section>
        <SectionHeading
          eyebrow="课程表"
          title={`${lessons.length} 节正式课 + ${events.length} 场社区活动`}
          subtitle="7 月 25 日开营 — 8 月 23 日结营，全程 30 天"
          className="text-center mb-12"
        />
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="w-28 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">日期</th>
                <th className="w-24 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">时间</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">内容</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-muted/30 ${item.isEvent ? "bg-muted/15" : idx % 2 === 0 ? "bg-transparent" : "bg-muted/5"}`}
                >
                  <td className="px-5 py-3.5 align-top">
                    <span className={`font-semibold whitespace-nowrap ${item.isEvent ? "text-accent" : ""}`}>{item.date}</span>
                  </td>
                  <td className="px-5 py-3.5 align-top text-muted-foreground whitespace-nowrap">{item.time}</td>
                  <td className="px-5 py-3.5 align-top">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                          item.isEvent
                            ? "bg-accent/15 text-accent"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {item.isEvent ? "活动" : "课程"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{item.title}</p>
                        {item.content && <p className="mt-1 text-xs text-muted-foreground">{item.content}</p>}
                        {item.instructor && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/60">讲师</span> {item.instructor}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-28" />
    </div>
  );
}
