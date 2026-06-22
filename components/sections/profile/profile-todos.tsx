"use client";

import { ArrowRight, Bot, Check, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { QRFrame } from "@/components/shared/qr-frame";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ASSISTANT_DONE_KEY = "seedao.todo.assistant";

// "Added the assistant?" is remembered locally and exposed as an external store
// — `useSyncExternalStore` gives an SSR-safe read without a synchronous setState
// inside an effect (same approach as `lib/account` and `useHydrated`).
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
 * The new-member checklist shown on the profile page. The first todo — adding
 * the community assistant on WeChat — is where the assistant QR now lives (it
 * used to sit in the payment panel). Completion is remembered locally so the
 * list reflects progress on return visits; the agent todo reuses the account's
 * `agentClaimed` flag set by the onboarding game.
 */
export function ProfileTodos() {
  const t = useT();
  const account = useAccount();
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
                src="/qr/wechat-help.svg"
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

        <TodoItem
          index={2}
          done={account.agentClaimed}
          icon={<Bot className="size-4" />}
          title={t.profile.todoAgentTitle}
          desc={t.profile.todoAgentDesc}
        >
          {!account.agentClaimed && (
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/onboarding">
                  {t.profile.todoAgentCta}
                  <ArrowRight className="size-4" />
                </Link>
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
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">{index}</span>
      </div>
      {children}
    </li>
  );
}
