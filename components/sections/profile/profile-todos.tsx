"use client";

import { Check, MessageCircle } from "lucide-react";
import { useSyncExternalStore } from "react";
import { QRFrame } from "@/components/shared/qr-frame";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ASSISTANT_DONE_KEY = "seedao.todo.assistant";

const listeners = new Set<() => void>();
function subscribeAssistant(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}
function readAssistantDone(): boolean {
  try {
    return localStorage.getItem(ASSISTANT_DONE_KEY) === "1";
  } catch {
    return false;
  }
}
function markAssistantDone() {
  try {
    localStorage.setItem(ASSISTANT_DONE_KEY, "1");
  } catch {
    /* ignore */
  }
  for (const l of listeners) l();
}

/**
 * New-member checklist on the profile page. Account bindings (Feishu, etc.)
 * live in `ProfileBindings`, not here.
 */
export function ProfileTodos() {
  const t = useT();
  const assistantDone = useSyncExternalStore(subscribeAssistant, readAssistantDone, () => false);

  return (
    <section className="mt-6">
      <header className="mb-4">
        <h2 className="text-lg font-bold">{t.profile.todosTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.todosSubtitle}</p>
      </header>

      <ol className="flex flex-col gap-3">
        <TodoItem
          index={1}
          done={assistantDone}
          icon={<MessageCircle className="size-4" />}
          title={t.profile.todoAssistantTitle}
          desc={t.profile.todoAssistantDesc}
        >
          {!assistantDone && (
            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              <QRFrame
                src="/qr/wechat-help.png"
                alt={t.profile.todoAssistantQrAlt}
                size={172}
                withBadge={false}
              />
              <p className="text-sm text-muted-foreground">{t.profile.todoAssistantQrHint}</p>
              <Button variant="outline" size="sm" onClick={markAssistantDone}>
                <Check className="size-4" />
                {t.profile.todoMarkDone}
              </Button>
            </div>
          )}
        </TodoItem>
      </ol>
    </section>
  );
}

function TodoItem({
  index,
  done,
  icon,
  title,
  desc,
  children,
}: {
  index: number;
  done: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  const t = useT();
  return (
    <li
      className={cn(
        "rounded-2xl border bg-card p-5",
        done ? "border-border opacity-70" : "border-primary/30",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            done ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}
          aria-hidden
        >
          {done ? <Check className="size-4" /> : icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Check className="size-3" />
                {t.profile.todoStatusDone}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
          {children}
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">{index}</span>
      </div>
    </li>
  );
}
