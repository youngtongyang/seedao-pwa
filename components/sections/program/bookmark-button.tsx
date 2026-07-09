"use client";

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/lib/course/bookmarks-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * 收藏（稍后再看）按钮。
 * - `full`：带文字，用于详情页；
 * - `icon`：仅图标，用于项目卡片右上角的 action 插槽（阻止冒泡，避免触发卡片跳转）。
 * 游客点按时提示登录（收藏需要注册账号，无需会员）。
 */
export function BookmarkButton({
  courseId,
  variant = "full",
  className,
}: {
  courseId: string;
  variant?: "full" | "icon";
  className?: string;
}) {
  const t = useT();
  const { isBookmarked, toggle } = useBookmarks();
  const [hint, setHint] = useState<"login" | "failed" | null>(null);
  const [pending, setPending] = useState(false);

  const saved = isBookmarked(courseId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setHint(null);
    setPending(true);
    const r = await toggle(courseId);
    setPending(false);
    if (!r.ok) setHint(r.unauthorized ? "login" : "failed");
  };

  if (variant === "icon") {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "size-8 rounded-full bg-card/80 backdrop-blur",
            saved && "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15",
          )}
          onClick={handleToggle}
          aria-label={saved ? t.program.bookmarkRemove : t.program.bookmarkAdd}
          aria-pressed={saved}
        >
          {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        </Button>
        {hint && (
          <div className="absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
            {hint === "login" ? (
              <Link href="/login" className="text-primary">
                {t.program.bookmarkLoginHint}
              </Link>
            ) : (
              <span className="text-destructive">{t.program.bookmarkFailed}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "self-start",
          saved && "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent",
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saved ? (
          <BookmarkCheck className="size-4" />
        ) : (
          <Bookmark className="size-4" />
        )}
        {saved ? t.program.bookmarkRemove : t.program.bookmarkAdd}
      </Button>
      {hint === "login" && (
        <p className="text-xs text-muted-foreground">
          <Link href="/login" className="text-primary underline-offset-2 hover:underline">
            {t.program.bookmarkLoginHint}
          </Link>
        </p>
      )}
      {hint === "failed" && <p className="text-xs text-destructive">{t.program.bookmarkFailed}</p>}
    </div>
  );
}
