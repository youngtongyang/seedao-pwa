"use client";

import { ArrowRight, BookmarkX, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/lib/course/bookmarks-store";
import { listCourseOrders } from "@/lib/course/client";
import { useLocalized, useT } from "@/lib/i18n";
import { getProgramByCourseId, type Program } from "@/lib/mock/programs";
import { cn } from "@/lib/utils";

type OrdersState =
  | { status: "loading" }
  | { status: "ready"; enrolledCourseIds: ReadonlySet<string> }
  | { status: "error" };

type Row = { program: Program; enrolled: boolean; saved: boolean };

const accentBubble: Record<Program["accent"], string> = {
  violet: "bg-primary/10 text-primary",
  amber: "bg-accent/15 text-accent",
};

/**
 * 「我的项目」：收藏 + 已报名的共学项目，数据来自
 * `/api/course/bookmarks`（共享 store）与 `/api/course/orders`（本组件拉取）。
 * 两路数据互不阻塞：一路失败仍渲染另一路，失败的一路给出重试。
 * 注意：个人主页有会员门禁，已注册未付费用户的收藏只在项目页可见。
 */
export function ProfilePrograms() {
  const t = useT();
  const pick = useLocalized();
  const { state: bookmarks, toggle, refresh } = useBookmarks();
  const [orders, setOrders] = useState<OrdersState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stale = false;
    listCourseOrders().then((r) => {
      if (stale) return;
      if (r.ok) {
        const ids = new Set(
          r.data.orders
            .filter((o) => o.status === "paid" || o.enrollment_status === "active")
            .map((o) => o.course_id),
        );
        setOrders({ status: "ready", enrolledCourseIds: ids });
      } else {
        setOrders({ status: "error" });
      }
    });
    return () => {
      stale = true;
    };
  }, [attempt]);

  const bookmarksPending = bookmarks.status === "unloaded" || bookmarks.status === "loading";
  const loading = orders.status === "loading" || bookmarksPending;
  const failed = orders.status === "error" || bookmarks.status === "error";

  // 汇总为行：已报名优先；找不到对应项目的 course_id（如已下架）静默跳过
  const rows: Row[] = [];
  if (orders.status === "ready") {
    for (const courseId of orders.enrolledCourseIds) {
      const program = getProgramByCourseId(courseId);
      if (program) rows.push({ program, enrolled: true, saved: false });
    }
  }
  if (bookmarks.status === "ready") {
    for (const courseId of bookmarks.ids) {
      const program = getProgramByCourseId(courseId);
      if (!program) continue;
      const existing = rows.find((r) => r.program.courseId === courseId);
      if (existing) existing.saved = true;
      else rows.push({ program, enrolled: false, saved: true });
    }
  }
  rows.sort((a, b) => Number(b.enrolled) - Number(a.enrolled));

  const retry = () => {
    if (orders.status === "error") {
      // 重置回 loading 放在事件处理器里（初次挂载时初始值已是 loading）
      setOrders({ status: "loading" });
      setAttempt((n) => n + 1);
    }
    if (bookmarks.status === "error") refresh();
  };

  return (
    <section className="mt-6">
      <header className="mb-4">
        <h2 className="text-lg font-bold">{t.profile.myProgramsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.myProgramsSubtitle}</p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && rows.length === 0 && !failed && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">{t.profile.myProgramsEmpty}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/program">
                {t.profile.myProgramsBrowse}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map(({ program, enrolled, saved }) => {
              const Icon = program.icon;
              return (
                <li key={program.courseId} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <Link
                    href={`/program/${program.slug}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        accentBubble[program.accent],
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {pick(program.title)}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        {enrolled && (
                          <Badge variant="success">{t.profile.myProgramsEnrolled}</Badge>
                        )}
                        {saved && !enrolled && (
                          <Badge variant="outline">{t.profile.myProgramsSaved}</Badge>
                        )}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                  {saved && !enrolled && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void toggle(program.courseId)}
                      aria-label={t.profile.myProgramsRemove}
                      title={t.profile.myProgramsRemove}
                    >
                      <BookmarkX className="size-4" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!loading && failed && (
          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-2 text-center",
              rows.length > 0 ? "border-t border-border pt-3 pb-1" : "py-6",
            )}
          >
            <p className="text-sm text-destructive">{t.profile.myProgramsLoadFailed}</p>
            <Button variant="outline" size="sm" onClick={retry}>
              {t.common.retry}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
