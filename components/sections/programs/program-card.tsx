"use client";

import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useLocalized, useT } from "@/lib/i18n";
import type { Accent, Program, ProgramStatus } from "@/lib/mock/programs";
import { cn } from "@/lib/utils";

const accentBubble: Record<Accent, string> = {
  violet: "bg-primary/10 text-primary",
  amber: "bg-accent/15 text-accent",
};

const statusVariant: Record<ProgramStatus, "success" | "default" | "outline"> = {
  enrolling: "success",
  upcoming: "default",
  ended: "outline",
};

/**
 * 项目卡片，用于项目列表页与首页展示位。
 * `action` 渲染在卡片右上角、Link 之外（绝对定位的兄弟节点），
 * 供收藏按钮等操作使用而不触发跳转。
 */
export function ProgramCard({
  program,
  action,
  className,
}: {
  program: Program;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = useT();
  const pick = useLocalized();
  const Icon = program.icon;

  return (
    <div className={cn("group relative h-full", className)}>
      <Link
        href={`/program/${program.slug}`}
        className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
      >
        <div className={cn("flex items-center gap-3", action && "pr-10")}>
          <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", accentBubble[program.accent])}>
            <Icon className="size-6" />
          </div>
          <Badge variant={statusVariant[program.status]}>
            {t.programs.status[program.status]}
          </Badge>
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-bold leading-snug">{pick(program.title)}</h3>
          <p className="text-sm font-medium text-foreground/75">{pick(program.tagline)}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{pick(program.summary)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {program.durationDays} {t.program.unitDays}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {program.lessonCount} {t.program.unitLessons}
          </span>
          <span>{pick(program.dateRange)}</span>
        </div>

        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          {t.common.learnMore}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {action && <div className="absolute right-4 top-4">{action}</div>}
    </div>
  );
}
