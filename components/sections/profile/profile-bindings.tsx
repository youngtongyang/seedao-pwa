"use client";

import { Check, Copy, Link2, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BindingItem, FeishuChallengeResult } from "@/lib/api/types";
import {
  createFeishuChallenge,
  fetchFeishuBinding,
  unbindFeishuBinding,
} from "@/lib/bindings/client";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Connected accounts on the profile page. Feishu first; more providers can
 * append as sibling rows in the same list.
 */
export function ProfileBindings({
  feishu,
  onFeishuChange,
}: {
  feishu: BindingItem | null;
  onFeishuChange: (next: BindingItem) => void;
}) {
  const t = useT();

  return (
    <section id="bindings" className="mt-8 scroll-mt-24">
      <header className="mb-4">
        <h2 className="text-lg font-bold">{t.profile.bindingsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.bindingsSubtitle}</p>
      </header>

      <ul className="flex flex-col gap-3">
        <FeishuBindingRow feishu={feishu} onFeishuChange={onFeishuChange} />
      </ul>
    </section>
  );
}

function FeishuBindingRow({
  feishu,
  onFeishuChange,
}: {
  feishu: BindingItem | null;
  onFeishuChange: (next: BindingItem) => void;
}) {
  const t = useT();
  const bound = !!feishu?.bound;
  const displayName = feishu?.display_name?.trim();

  const [challenge, setChallenge] = useState<FeishuChallengeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [unbinding, setUnbinding] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Clear in-progress challenge UI once bound.
  useEffect(() => {
    if (bound) {
      setChallenge(null);
      setError(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setWaiting(false);
    }
  }, [bound]);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaiting(false);
  }

  function startPolling() {
    stopPolling();
    setWaiting(true);
    pollRef.current = setInterval(async () => {
      const binding = await fetchFeishuBinding();
      if (binding?.bound) {
        stopPolling();
        onFeishuChange(binding);
      }
    }, 3000);
  }

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    const result = await createFeishuChallenge();
    setBusy(false);
    if (!result.ok) {
      if (result.error.error === "feishu_already_bound") {
        const binding = await fetchFeishuBinding();
        if (binding?.bound) onFeishuChange(binding);
        return;
      }
      setError(
        result.error.error === "feishu_bind_credential_invalid"
          ? t.profile.feishuErrCredentialInvalid
          : t.profile.feishuErrGeneric,
      );
      return;
    }
    setChallenge(result.data);
    startPolling();
  }

  async function handleRefresh() {
    setError(null);
    const binding = await fetchFeishuBinding();
    if (binding?.bound) {
      stopPolling();
      onFeishuChange(binding);
      return;
    }
    setError(t.profile.feishuWaiting);
  }

  async function handleCopy() {
    if (!challenge) return;
    const text = `绑定 ${challenge.bind_code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function handleUnbind() {
    if (unbinding) return;
    setUnbinding(true);
    const result = await unbindFeishuBinding();
    setUnbinding(false);
    if (result.ok) onFeishuChange({ provider: "feishu", bound: false });
  }

  const showPrimaryAction = bound || !challenge;

  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              bound ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
            )}
            aria-hidden
          >
            {bound ? <Check className="size-4" /> : <Link2 className="size-4" />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{t.profile.feishuLabel}</h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  bound ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {bound ? t.profile.feishuBound : t.profile.feishuUnbound}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {bound
                ? displayName
                  ? t.profile.feishuBoundAs(displayName)
                  : t.profile.feishuBoundDesc
                : t.profile.feishuDesc}
            </p>
          </div>
        </div>

        {showPrimaryAction && (
          <div className="shrink-0 sm:self-center">
            {bound ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={unbinding}
                onClick={handleUnbind}
              >
                {unbinding ? t.profile.feishuUnbinding : t.profile.feishuUnbind}
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleGenerate}
                disabled={busy}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                {t.profile.feishuGenerateCode}
              </Button>
            )}
          </div>
        )}
      </div>

      {!bound && challenge && (
        <div className="mt-4">
          <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04]">
            <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-4 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">{t.profile.feishuSendHint}</p>
              {waiting && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  {t.profile.feishuWaiting}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2.5 font-mono text-base font-semibold tracking-wide text-foreground ring-1 ring-border">
                {`绑定 ${challenge.bind_code}`}
              </code>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={handleCopy}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? t.profile.feishuCopied : t.profile.feishuCopyCode}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  aria-label={t.profile.feishuRefresh}
                >
                  <RefreshCw className="size-4" />
                  <span className="sm:hidden">{t.profile.feishuRefresh}</span>
                </Button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
            onClick={handleGenerate}
            disabled={busy}
          >
            {t.profile.feishuRegen}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </li>
  );
}
