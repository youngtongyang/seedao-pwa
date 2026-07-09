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
import type { ProposalListItem } from "@/lib/proposals/types";
import { ProposalCard } from "./proposal-card";

type TabKey = "all" | "history" | "mine";

export function ProposalListView() {
  const t = useT();
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
    void load(false);
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t.proposals.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.proposals.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={authed ? "/proposals/new" : "/login"}>{t.proposals.createCta}</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mb-6">
        <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
          {(["all", "history", "mine"] as const).map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {t.proposals.tabs[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">{t.proposals.filters.allTypes}</option>
          {Object.values(PROPOSAL_TYPES).map((pt) => (
            <option key={pt.id} value={pt.id}>
              {pt.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">{t.proposals.filters.allStatuses}</option>
          {Object.values(PROPOSAL_STATUSES).map((st) => (
            <option key={st.id} value={st.id}>
              {st.label}
            </option>
          ))}
        </select>

        <Input
          placeholder="SIP"
          value={sipFilter}
          onChange={(e) => setSipFilter(e.target.value)}
          className="h-10 w-full rounded-xl sm:w-24"
        />

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.proposals.filters.search}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            className="h-10 rounded-xl pl-9"
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
        <div className="flex flex-col gap-3">
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
