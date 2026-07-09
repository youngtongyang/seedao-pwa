"use client";

import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
  Vote,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthed } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { fetchProfile } from "@/lib/profile/client";
import {
  castVote,
  closeProposal,
  fetchMyVote,
  fetchProposal,
  fetchVotes,
} from "@/lib/proposals/client";
import { canWithdraw } from "@/lib/proposals/lifecycle";
import { decodeProposalContent, decodeVoteOptions } from "@/lib/proposals/codec";
import { formatDateTime, isUnsubmittedDraft, normalizeVoteType, shouldFetchMyVote, showsVoteRules, snsEquals, isCommentableStatus } from "@/lib/proposals/constants";
import { proposalVoteTypeLabel, useProposalCopy } from "@/lib/proposals/use-proposal-copy";
import { prepareDisplayBlocks, collectMotivationWalletAddresses } from "@/lib/proposals/template-blocks";
import type { ProposalDetail, ProposalVoteItem } from "@/lib/proposals/types";
import { fetchSnsByWallet } from "@/lib/sns/client";
import { decodeVoteResult, encodeVoteResult, filterVotesByOption, isMultiVote } from "@/lib/proposals/vote";
import { CommentPanel } from "./comment-panel";
import { ProposalBlockView } from "./proposal-block-view";
import { ProposalContentView } from "./proposal-content-view";
import { ProposalStatusBadge, ProposalTypeBadge } from "./proposal-badges";
import { ProposalSection } from "./proposal-section";
import { VoteDialog } from "./vote-dialog";
import { VoteSummaryPanel } from "./vote-summary-panel";
import { VoteVotersDialog } from "./vote-voters-dialog";
import { WithdrawDialog } from "./withdraw-dialog";
import { ProposalRulesDialog } from "./proposal-rules-dialog";
import { ProposalStatusBanner } from "./proposal-status-banner";

export function ProposalDetailView({ id }: { id: number }) {
  const t = useT();
  const copy = useProposalCopy();
  const router = useRouter();
  const authed = useAuthed();

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [votes, setVotes] = useState<ProposalVoteItem[]>([]);
  const [mySns, setMySns] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersOption, setVotersOption] = useState<string | null>(null);
  const [voteOpen, setVoteOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [voting, setVoting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [resolvedWallets, setResolvedWallets] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    if (!authed) return;
    fetchProfile().then((p) => setMySns(p?.sns_name ?? null));
  }, [authed]);

  const load = useCallback(async () => {
    setLoading(true);
    const [detailRes, votesRes] = await Promise.all([
      fetchProposal(id, { include_votes: true, include_comments: true }),
      fetchVotes(id),
    ]);
    setLoading(false);
    if (detailRes.ok) {
      setProposal(detailRes.data);
      setResolvedWallets(new Map());
    }
    if (votesRes.ok) setVotes(votesRes.data);

    if (
      authed &&
      detailRes.ok &&
      shouldFetchMyVote(detailRes.data.status)
    ) {
      const mine = await fetchMyVote(id);
      if (mine.ok && mine.data) {
        const multi = isMultiVote(detailRes.data.vote_type);
        setSelected(decodeVoteResult(mine.data.vote_result, multi));
      }
    } else {
      setSelected([]);
    }
  }, [id, authed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void load();
  }, [load]);

  const baseWalletMap = useMemo(() => {
    if (!proposal) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const vote of votes.length ? votes : (proposal.votes ?? [])) {
      if (vote.voter_wallet) map.set(vote.voter_wallet.toLowerCase(), vote.sns_name);
    }
    if (proposal.proposer_wallet && proposal.proposer_sns) {
      map.set(proposal.proposer_wallet.toLowerCase(), proposal.proposer_sns);
    }
    return map;
  }, [proposal, votes]);

  const walletMap = useMemo(
    () => new Map([...baseWalletMap, ...resolvedWallets]),
    [baseWalletMap, resolvedWallets],
  );

  useEffect(() => {
    if (!proposal) return;

    const content = decodeProposalContent(proposal.content);
    const addresses = collectMotivationWalletAddresses(content.blocks ?? []);
    const missing = addresses.filter((address) => !baseWalletMap.has(address));
    if (!missing.length) return;

    let cancelled = false;
    void (async () => {
      const next = new Map<string, string>();
      await Promise.all(
        missing.map(async (address) => {
          const result = await fetchSnsByWallet(address);
          if (result.ok && result.data.sns_name) {
            next.set(address, result.data.sns_name);
          }
        }),
      );
      if (!cancelled) setResolvedWallets(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [proposal, baseWalletMap]);

  async function handleVote() {
    if (!selected.length || !proposal) return;
    setVoting(true);
    const multi = isMultiVote(proposal.vote_type);
    const result = await castVote(id, {
      vote_result: encodeVoteResult(selected, multi),
    });
    setVoting(false);
    if (result.ok) {
      setVoteOpen(false);
      void load();
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    const result = await closeProposal(id);
    setWithdrawing(false);
    if (result.ok) {
      setWithdrawOpen(false);
      router.push("/proposals");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{t.proposals.detail.notFound}</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/proposals">{t.proposals.backToList}</Link>
        </Button>
      </div>
    );
  }

  const content = decodeProposalContent(proposal.content);
  const displayBlocks = content.blocks ? prepareDisplayBlocks(content.blocks) : [];
  const options = decodeVoteOptions(proposal.vote_options);
  const voteType = normalizeVoteType(proposal.vote_type);
  const multi = isMultiVote(voteType);
  const allVotes = votes.length ? votes : (proposal.votes ?? []);
  const filteredVotes = votersOption
    ? filterVotesByOption(allVotes, votersOption, multi)
    : [];

  function openVoters(option: string) {
    setVotersOption(option);
    setVotersOpen(true);
  }

  const canVote = authed && proposal.status === "voting";
  const isUnsubmitted = isUnsubmittedDraft(proposal.status);
  const isOwner = snsEquals(proposal.proposer_sns, mySns);
  const canWithdrawDraft = isOwner && canWithdraw(proposal.status);
  const showVoteRules = showsVoteRules(proposal.type);
  const commentable = isCommentableStatus(proposal.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/proposals">
            <ArrowLeft className="size-4" />
            {t.proposals.backToList}
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {isUnsubmitted && isOwner && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/proposals/new?id=${id}`}>
                <Pencil className="size-4" />
                {t.proposals.detail.editDraft}
              </Link>
            </Button>
          )}
          {canWithdrawDraft && (
            <Button variant="outline" size="sm" onClick={() => setWithdrawOpen(true)}>
              <Trash2 className="size-4" />
              {t.proposals.withdraw.action}
            </Button>
          )}
          {canVote && (
            <Button variant="outline" size="sm" onClick={() => setVoteOpen(true)}>
              <Vote className="size-4" />
              {t.proposals.detail.vote}
            </Button>
          )}
          {showVoteRules && (
            <Button variant="outline" size="sm" onClick={() => setRulesOpen(true)}>
              {t.proposals.rules.action}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push(`#comments`)}>
            <MessageSquare className="size-4" />
            {t.proposals.detail.comment}
          </Button>
        </div>
      </div>

      {isUnsubmitted && isOwner && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          {t.proposals.detail.draftBanner}{" "}
          <Link href={`/proposals/new?id=${id}`} className="font-semibold text-primary underline">
            {t.proposals.detail.editDraft}
          </Link>
        </div>
      )}

      <ProposalStatusBanner proposal={proposal} onPhaseChange={() => void load()} />

      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <h1 className="text-xl font-black leading-snug sm:text-2xl">
          {proposal.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <ProposalTypeBadge type={proposal.type} />
          <ProposalStatusBadge status={proposal.status} />
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {proposalVoteTypeLabel(copy, voteType)}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {(proposal.proposer_sns || "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="text-sm">
            <span className="font-medium">{proposal.proposer_sns}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <time className="text-muted-foreground">{formatDateTime(proposal.created_at)}</time>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {displayBlocks.length > 0 ? (
          displayBlocks.map((display, index) => (
            <ProposalBlockView
              key={`${display.kind}-${display.block.id ?? display.block.title ?? index}`}
              display={display}
              walletMap={walletMap}
            />
          ))
        ) : (
          <>
            <ProposalSection title={t.proposals.form.background}>
              <ProposalContentView markdown={content.background} />
            </ProposalSection>

            <ProposalSection title={t.proposals.form.body}>
              <ProposalContentView markdown={content.body} />
            </ProposalSection>

            {content.remarks && (
              <ProposalSection title={t.proposals.form.remarks}>
                <ProposalContentView markdown={content.remarks} />
              </ProposalSection>
            )}
          </>
        )}

        {(proposal.vote_summary || !isUnsubmitted) && (
          <VoteSummaryPanel
            summary={
              proposal.vote_summary ?? {
                total_votes: 0,
                valid_votes: 0,
                approve_count: 0,
                reject_count: 0,
                abstain_count: 0,
                approve_rate: 0,
                participation_rate: 0,
                by_result: Object.fromEntries(options.map((o) => [o, 0])),
                passed: false,
                resolved: false,
                resolution_rule: proposal.resolution_rule ?? "",
              }
            }
            options={options}
            title={proposal.title}
            onShowVotersForOption={
              (proposal.vote_summary?.total_votes ?? 0) > 0
                ? (option) => openVoters(option)
                : undefined
            }
            onShowRules={showVoteRules ? () => setRulesOpen(true) : undefined}
          />
        )}
      </div>

      <div id="comments" className="mt-8">
        <CommentPanel
          key={`${id}-${(proposal.comments ?? []).map((c) => c.id).join(",")}`}
          proposalId={id}
          proposal={proposal}
          comments={proposal.comments ?? []}
          commentable={commentable}
          onCommentAdded={() => void load()}
        />
      </div>

      <VoteVotersDialog
        open={votersOpen}
        onOpenChange={(open) => {
          setVotersOpen(open);
          if (!open) setVotersOption(null);
        }}
        votes={filteredVotes}
        total={filteredVotes.length}
        optionLabel={votersOption}
      />

      <VoteDialog
        open={voteOpen}
        onOpenChange={setVoteOpen}
        options={options}
        voteType={voteType}
        selected={selected}
        onSelectedChange={setSelected}
        onConfirm={() => void handleVote()}
        voting={voting}
      />

      <ProposalRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        resolutionRule={proposal.resolution_rule}
        proposalType={proposal.type}
        voteType={voteType}
        backendRuleText={proposal.vote_summary?.resolution_rule}
        publicitySeconds={proposal.publicity_seconds}
        voteDurationSeconds={proposal.vote_duration_seconds}
      />

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onConfirm={() => void handleWithdraw()}
        withdrawing={withdrawing}
      />
    </div>
  );
}
