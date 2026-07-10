"use client";

import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthed } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { fetchProfile } from "@/lib/profile/client";
import { fetchProposals } from "@/lib/proposals/client";
import { isHistoryStatus, PROPOSAL_STATUSES, PROPOSAL_TYPES, snsEquals } from "@/lib/proposals/constants";
import { proposalStatusLabel, proposalTypeLabel, useProposalCopy } from "@/lib/proposals/use-proposal-copy";
import type { ProposalListItem } from "@/lib/proposals/types";
import { ProposalCard } from "./proposal-card";

type TabKey = "all" | "history" | "mine";

export function ProposalListView() {
  const t = useT();
  const copy = useProposalCopy();
  const authed = useAuthed();

  const [tab, setTab] = useState<TabKey>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sipFilter, setSipFilter] = useState("");
  const [debouncedSip, setDebouncedSip] = useState("");

  const [fetchedItems, setFetchedItems] = useState<ProposalListItem[]>([]);
  const [nextBefore, setNextBefore] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mySns, setMySns] = useState<string | null>(null);

  useEffect(() => {
    if (!authed) return;
    fetchProfile().then((p) => setMySns(p?.sns_name ?? null));
  }, [authed]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSip(sipFilter.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [sipFilter]);

  const load = useCallback(
    async (append = false, beforeId?: number) => {
      if ((debouncedSip || keyword) && append) return;

      if (append) setLoadingMore(true);
      else setLoading(true);

      const result = await fetchProposals({
        limit: 20,
        before_id: beforeId,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        sip: debouncedSip || undefined,
        keyword: keyword || undefined,
      });

      if (append) setLoadingMore(false);
      else setLoading(false);

      if (!result.ok) {
        setLoadError(result.message ?? t.proposals.loadFailed);
        return;
      }
      setLoadError(null);

      const batch = result.data.items;

      if (append) setFetchedItems((prev) => [...prev, ...batch]);
      else setFetchedItems(batch);
      setNextBefore(result.data.next_before);
    },
    [typeFilter, statusFilter, debouncedSip, keyword, t.proposals.loadFailed],
  );

  const items = useMemo(() => {
    let batch = fetchedItems;

    if (tab === "history") {
      batch = batch.filter((i) => isHistoryStatus(i.status));
    } else if (tab === "mine" && mySns) {
      batch = batch.filter((i) => snsEquals(i.proposer_sns, mySns));
    }

    return batch;
  }, [fetchedItems, tab, mySns]);

  const submitSearch = () => {
    setKeyword(searchInput.trim());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when filters change
    void load(false);
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-12">
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-8 sm:items-center">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight sm:text-3xl">{t.proposals.title}</h1>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:mt-1 sm:line-clamp-none sm:text-sm">
            {t.proposals.subtitle}
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0 rounded-full px-4 sm:h-10 sm:rounded-md sm:px-4">
          <Link href={authed ? "/proposals/new" : "/login"}>{t.proposals.createCta}</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mb-4 sm:mb-6">
        <TabsList className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
          {(["all", "history", "mine"] as const).map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {t.proposals.tabs[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 min-w-0 rounded-xl border border-input bg-background px-2.5 text-xs sm:h-10 sm:px-3 sm:text-sm"
        >
          <option value="">{t.proposals.filters.allTypes}</option>
          {Object.values(PROPOSAL_TYPES).map((pt) => (
            <option key={pt.id} value={pt.id}>
              {proposalTypeLabel(copy, pt.id)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 min-w-0 rounded-xl border border-input bg-background px-2.5 text-xs sm:h-10 sm:px-3 sm:text-sm"
        >
          <option value="">{t.proposals.filters.allStatuses}</option>
          {Object.values(PROPOSAL_STATUSES).map((st) => (
            <option key={st.id} value={st.id}>
              {proposalStatusLabel(copy, st.id)}
            </option>
          ))}
        </select>

        <Input
          placeholder="SIP"
          value={sipFilter}
          onChange={(e) => setSipFilter(e.target.value)}
          className="h-9 rounded-xl text-xs sm:h-10 sm:w-24 sm:text-sm"
        />

        <div className="relative col-span-2 min-w-0 sm:col-span-1 sm:min-w-[180px] sm:flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.proposals.filters.search}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            className="h-9 rounded-xl pl-9 text-xs sm:h-10 sm:text-sm"
          />
        </div>
      </div>

      {loadError && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : tab === "mine" && !authed ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{t.proposals.loginToViewMine}</p>
          <Button asChild className="mt-4">
            <Link href="/login">{t.nav.login}</Link>
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t.proposals.empty}</p>
      ) : (
        <div className="flex flex-col gap-2 sm:gap-3">
          {items.map((item) => (
            <ProposalCard key={item.id} item={item} mySns={mySns} />
          ))}
        </div>
      )}

      {nextBefore && !loading && !debouncedSip && !keyword && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => void load(true, nextBefore)}
          >
            {loadingMore ? <Loader2 className="size-4 animate-spin" /> : t.proposals.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
