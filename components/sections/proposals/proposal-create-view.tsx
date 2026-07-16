"use client";

import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n";
import { loginHrefForCurrentPage } from "@/lib/auth/return-to";
import {
  createProposal,
  closeProposal,
  fetchProposal,
  fetchProposalPermissions,
  publishProposal,
  updateProposal,
} from "@/lib/proposals/client";
import {
  encodeProposalContent,
  encodeVoteOptions,
  decodeProposalContent,
  decodeVoteOptions,
} from "@/lib/proposals/codec";
import {
  PROPOSAL_TYPES,
  PROPOSAL_TYPE_GROUPS,
  VOTE_TYPES,
  normalizeProposalType,
} from "@/lib/proposals/constants";
import type { CreatableProposalType, ProposalCreatePermissions, VoteType } from "@/lib/proposals/types";
import { canCreateProposalType } from "@/lib/proposals/permissions";
import { proposalTypeLabel, useProposalCopy } from "@/lib/proposals/use-proposal-copy";
import { isMultiVote } from "@/lib/proposals/vote";
import { cn } from "@/lib/utils";
import { ProposalSection } from "./proposal-section";
import { ProposalRichEditor } from "./proposal-rich-editor";
import { RuleTypeDialog } from "./rule-type-dialog";
import { WithdrawDialog } from "./withdraw-dialog";

type FormState = {
  title: string;
  background: string;
  body: string;
  remarks: string;
  options: string[];
};

function sameOptions(a: string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function ProposalCreateView() {
  const t = useT();
  const copy = useProposalCopy();
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("id") ? Number(searchParams.get("id")) : undefined;
  const initialType = (searchParams.get("type") as CreatableProposalType) || null;

  const [step, setStep] = useState<"pick" | "form">(editId || initialType ? "form" : "pick");
  const [type, setType] = useState<CreatableProposalType | null>(initialType);
  const [voteType, setVoteType] = useState<VoteType>(1);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [pendingType, setPendingType] = useState<CreatableProposalType | null>(null);

  const singleDefaults = t.proposals.form.defaultSingleOptions;
  const multiDefaults = t.proposals.form.defaultMultiOptions;

  function defaultOptionsFor(vt: VoteType): string[] {
    return isMultiVote(vt) ? [...multiDefaults] : [...singleDefaults];
  }

  const [form, setForm] = useState<FormState>({
    title: "",
    background: "",
    body: "",
    remarks: "",
    options: [...singleDefaults],
  });
  const [draftId, setDraftId] = useState<number | undefined>(editId);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [permissions, setPermissions] = useState<ProposalCreatePermissions | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(!editId);

  useEffect(() => {
    if (editId) return;
    fetchProposalPermissions().then((res) => {
      setPermissionsLoading(false);
      if (res.ok) {
        setPermissions(res.data);
        if (initialType && !canCreateProposalType(res.data, initialType)) {
          setStep("pick");
          setType(null);
          setError(t.proposals.create.noPermission);
        }
      } else if (res.error === "unauthorized") router.push(loginHrefForCurrentPage("/proposals/new"));
    });
  }, [editId, initialType, router, t.proposals.create.noPermission]);

  function handleVoteTypeChange(next: VoteType) {
    setVoteType(next);
    setForm((f) => {
      if (sameOptions(f.options, singleDefaults) || sameOptions(f.options, multiDefaults)) {
        return { ...f, options: defaultOptionsFor(next) };
      }
      return f;
    });
  }

  useEffect(() => {
    if (!editId) return;
    fetchProposal(editId).then((res) => {
      setLoading(false);
      if (!res.ok || res.data.status !== "draft") return;
      setDraftId(res.data.id);
      setType(normalizeProposalType(res.data.type) as CreatableProposalType);
      const c = decodeProposalContent(res.data.content);
      const vt = (c.vote_type ?? res.data.vote_type ?? 1) as VoteType;
      setVoteType(vt);
      const opts = c.vote_options?.length
        ? c.vote_options
        : decodeVoteOptions(res.data.vote_options);
      const defaults = isMultiVote(vt) ? [...multiDefaults] : [...singleDefaults];
      setForm({
        title: res.data.title,
        background: c.background,
        body: c.body,
        remarks: c.remarks,
        options: opts.length ? opts : defaults,
      });
      setStep("form");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- edit draft load once per id
  }, [editId]);

  function pickType(next: CreatableProposalType) {
    if (!canCreateProposalType(permissions, next)) return;
    setPendingType(next);
    setRuleOpen(true);
  }

  function confirmType() {
    if (!pendingType) return;
    setType(pendingType);
    setForm((f) => ({ ...f, options: defaultOptionsFor(voteType) }));
    setRuleOpen(false);
    setStep("form");
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  }

  function removeOption(i: number) {
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  }

  function buildPayload() {
    if (!type) throw new Error("no type");
    const meta = PROPOSAL_TYPES[type];
    return {
      title: form.title.trim(),
      type,
      resolution_rule: meta.resolutionRule,
      vote_type: voteType,
      content: encodeProposalContent({
        background: form.background,
        body: form.body,
        remarks: form.remarks,
        vote_type: voteType,
        vote_options: form.options.filter(Boolean),
      }),
      vote_options: encodeVoteOptions(form.options.filter(Boolean)),
    };
  }

  async function handleSave() {
    if (!type || !form.title.trim()) {
      setError(t.proposals.create.titleRequired);
      return;
    }
    setSaving(true);
    setError(null);
    const payload = buildPayload();

    const result = draftId
      ? await updateProposal(draftId, {
          title: payload.title,
          content: payload.content,
          vote_options: payload.vote_options,
          vote_type: payload.vote_type,
        })
      : await createProposal(payload);

    setSaving(false);
    if (!result.ok) {
      if (result.error === "unauthorized") {
        router.push(loginHrefForCurrentPage("/proposals/new"));
        return;
      }
      setError(result.message ?? t.proposals.create.saveFailed);
      return;
    }
    setDraftId(result.data.id);
    router.replace(`/proposals/new?id=${result.data.id}`);
  }

  async function handlePublish() {
    if (!form.title.trim()) {
      setError(t.proposals.create.titleRequired);
      return;
    }
    setPublishing(true);
    setError(null);

    let id = draftId;
    if (!id) {
      const payload = buildPayload();
      const created = await createProposal(payload);
      if (!created.ok) {
        setPublishing(false);
        if (created.error === "unauthorized") {
          router.push(loginHrefForCurrentPage("/proposals/new"));
          return;
        }
        setError(created.message ?? t.proposals.create.saveFailed);
        return;
      }
      id = created.data.id;
      setDraftId(id);
    } else {
      const payload = buildPayload();
      const updated = await updateProposal(id, {
        title: payload.title,
        content: payload.content,
        vote_options: payload.vote_options,
        vote_type: payload.vote_type,
      });
      if (!updated.ok) {
        setPublishing(false);
        if (updated.error === "unauthorized") {
          router.push(loginHrefForCurrentPage("/proposals/new"));
          return;
        }
        setError(updated.message ?? t.proposals.create.saveFailed);
        return;
      }
    }

    const meta = type ? PROPOSAL_TYPES[type] : null;
    const pub = await publishProposal(id, {
      publicity_seconds: (meta?.defaultPublicityHours ?? 96) * 3600,
      vote_duration_seconds: (meta?.defaultVoteHours ?? 48) * 3600,
    });
    setPublishing(false);
    if (!pub.ok) {
      if (pub.error === "unauthorized") {
        router.push(loginHrefForCurrentPage("/proposals/new"));
        return;
      }
      setError(pub.message ?? t.proposals.create.publishFailed);
      return;
    }
    router.push(`/proposals/${id}`);
  }

  async function handleWithdraw() {
    if (!draftId) return;
    setWithdrawing(true);
    const result = await closeProposal(draftId);
    setWithdrawing(false);
    if (result.ok) {
      setWithdrawOpen(false);
      router.push("/proposals");
    } else {
      setError(result.message ?? t.proposals.withdraw.failed);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "pick") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-black">{t.proposals.create.pickType}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.proposals.create.pickTypeDesc}</p>
        {error && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {permissionsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="mt-8 space-y-8">
              {PROPOSAL_TYPE_GROUPS.map((group) => (
                <section key={group.id}>
                  <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                    {t.proposals.create.typeGroups[group.id as keyof typeof t.proposals.create.typeGroups]}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.types.map((key) => {
                      const allowed = canCreateProposalType(permissions, key);
                      const hint =
                        t.proposals.create.typeHint[key as keyof typeof t.proposals.create.typeHint];
                      const card = (
                        <button
                          type="button"
                          disabled={!allowed}
                          onClick={() => pickType(key)}
                          className={cn(
                            "w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors",
                            allowed
                              ? "hover:border-primary/40 hover:bg-muted/30"
                              : "cursor-not-allowed opacity-50",
                          )}
                        >
                          <p className="font-bold">{proposalTypeLabel(copy, key)}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
                        </button>
                      );

                      if (allowed) return <div key={key}>{card}</div>;

                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <span className="block w-full">{card}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-center">
                            {t.proposals.create.noPermission}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </TooltipProvider>
        )}
        <RuleTypeDialog
          open={ruleOpen}
          type={pendingType ?? "node_consensus_special"}
          voteType={voteType}
          onVoteTypeChange={handleVoteTypeChange}
          onConfirm={confirmType}
          onCancel={() => setRuleOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/proposals">
            <ArrowLeft className="size-4" />
            {t.proposals.create.title}
          </Link>
        </Button>
        <div className="flex gap-2">
          {draftId && (
            <Button
              variant="outline"
              disabled={saving || publishing || withdrawing}
              onClick={() => setWithdrawOpen(true)}
            >
              <Trash2 className="size-4" />
              {t.proposals.withdraw.action}
            </Button>
          )}
          <Button variant="outline" disabled={saving || publishing || withdrawing} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : t.proposals.create.save}
          </Button>
          <Button disabled={saving || publishing || withdrawing} onClick={() => void handlePublish()}>
            {publishing ? <Loader2 className="size-4 animate-spin" /> : t.proposals.create.submit}
          </Button>
        </div>
      </div>

      {type && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
            {PROPOSAL_TYPES[type].label}
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {VOTE_TYPES[voteType].label}
          </span>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-5">
        <ProposalSection title={t.proposals.form.titleLabel}>
          <Input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder={t.proposals.form.titlePlaceholder}
            className="rounded-xl"
          />
          <p className="mt-2 text-xs text-primary">{t.proposals.form.titleHint}</p>
        </ProposalSection>

        <ProposalSection title={t.proposals.form.background}>
          <ProposalRichEditor
            value={form.background}
            onChange={(v) => updateField("background", v)}
            placeholder={t.proposals.form.backgroundPlaceholder}
            minHeight={260}
          />
        </ProposalSection>

        <ProposalSection title={t.proposals.form.body}>
          <ProposalRichEditor
            value={form.body}
            onChange={(v) => updateField("body", v)}
            placeholder={t.proposals.form.bodyPlaceholder}
            minHeight={320}
          />
        </ProposalSection>

        <ProposalSection title={t.proposals.form.remarks}>
          <ProposalRichEditor
            value={form.remarks}
            onChange={(v) => updateField("remarks", v)}
            placeholder={t.proposals.form.remarksPlaceholder}
            minHeight={200}
          />
        </ProposalSection>

        <ProposalSection title={t.proposals.form.options}>
          {isMultiVote(voteType) && (
            <p className="mb-3 text-xs text-muted-foreground">{t.proposals.form.multiOptionsHint}</p>
          )}
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...form.options];
                    next[i] = e.target.value;
                    updateField("options", next);
                  }}
                  placeholder={`${t.proposals.form.optionLabel} ${i + 1}`}
                  className="rounded-xl"
                />
                {form.options.length > 2 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeOption(i)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="size-4" />
              {t.proposals.form.addOption}
            </Button>
          </div>
        </ProposalSection>
      </div>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onConfirm={() => void handleWithdraw()}
        withdrawing={withdrawing}
      />
    </div>
  );
}
