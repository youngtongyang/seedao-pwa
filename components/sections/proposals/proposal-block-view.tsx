"use client";

import Link from "next/link";
import type { PreviewComponent, ProjectBudgetSummary } from "@/lib/proposals/template-blocks";
import {
  formatBudgetSummaryAsset,
  formatDeadline,
  motivationAsset,
  sumMotivationAmount,
  type DisplayBlock,
} from "@/lib/proposals/template-blocks";
import type { MotivationBudgetItem } from "@/lib/proposals/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ProposalContentView } from "./proposal-content-view";
import { ProposalSection } from "./proposal-section";

function FieldBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl bg-muted/50 px-4 py-3 text-sm leading-relaxed", className)}>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function walletLabel(address: string | undefined, walletMap: Map<string, string>): string {
  if (!address) return "—";
  const sns = walletMap.get(address.toLowerCase());
  if (sns) return sns;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function RelateSection({
  data,
  title,
}: {
  data: Record<string, unknown>;
  title: string;
}) {
  const relate = String(data.relate ?? "");
  const proposalId = Number(data.proposal_id);
  const href = Number.isFinite(proposalId) ? `/proposals/${proposalId}` : undefined;

  return (
    <SubSection title={title}>
      <FieldBox>
        {href ? (
          <Link href={href} className="text-primary hover:underline">
            {relate}
          </Link>
        ) : (
          relate || "—"
        )}
      </FieldBox>
    </SubSection>
  );
}

function BudgetSection({
  data,
  labels,
}: {
  data: Record<string, unknown>;
  labels: {
    title: string;
    amount: string;
    assetType: string;
    prepayRatio: string;
    prepayDesc: string;
  };
}) {
  const list =
    (data.budgetList as Array<{
      amount?: string;
      description?: string;
      proportion?: string;
      typeTest?: { name?: string };
    }>) ?? [];
  if (!list.length) return null;

  return (
    <SubSection title={labels.title}>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">{labels.amount}</th>
              <th className="px-4 py-2.5 font-medium">{labels.assetType}</th>
              <th className="px-4 py-2.5 font-medium">{labels.prepayRatio}</th>
              <th className="px-4 py-2.5 font-medium">{labels.prepayDesc}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                <td className="px-4 py-3 tabular-nums">{item.amount ?? "0"}</td>
                <td className="px-4 py-3">{item.typeTest?.name ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{item.proportion ?? "0"}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SubSection>
  );
}

function DeliverablesSection({ data, title }: { data: Record<string, unknown>; title: string }) {
  const text = String(data.description ?? "").trim();
  if (!text) return null;
  return (
    <SubSection title={title}>
      <FieldBox className="whitespace-pre-wrap">{text}</FieldBox>
    </SubSection>
  );
}

function DeadlineSection({ data, title }: { data: Record<string, unknown>; title: string }) {
  const value = String(data.description ?? "").trim();
  if (!value) return null;
  return (
    <SubSection title={title}>
      <FieldBox>{formatDeadline(value)}</FieldBox>
    </SubSection>
  );
}

function PreviewBlockView({
  title,
  components,
  blocks,
}: {
  title: string;
  components: PreviewComponent[];
  blocks: ReturnType<typeof useT>["proposals"]["blocks"];
}) {
  const byName = Object.fromEntries(components.filter((c) => c.name).map((c) => [c.name!, c]));

  return (
    <ProposalSection title={title}>
      <div className="space-y-5">
        {byName.relate && <RelateSection data={byName.relate.data ?? {}} title={blocks.relateProposal} />}
        {byName.budget && (
          <BudgetSection
            data={byName.budget.data ?? {}}
            labels={{
              title: blocks.budgetApply,
              amount: blocks.amount,
              assetType: blocks.assetType,
              prepayRatio: blocks.prepayRatio,
              prepayDesc: blocks.prepayDesc,
            }}
          />
        )}
        {byName.deliverables && (
          <DeliverablesSection data={byName.deliverables.data ?? {}} title={blocks.deliverables} />
        )}
        {byName.deadline && <DeadlineSection data={byName.deadline.data ?? {}} title={blocks.deadline} />}
      </div>
    </ProposalSection>
  );
}

function BudgetSummaryGrid({
  projectBudget,
  blocks,
}: {
  projectBudget?: ProjectBudgetSummary;
  blocks: ReturnType<typeof useT>["proposals"]["blocks"];
}) {
  if (!projectBudget) return null;

  const { totalAmount, asset, prepayRatio } = projectBudget;
  const displayAsset = formatBudgetSummaryAsset(asset);
  const prepayAmount = Math.round((totalAmount * prepayRatio) / 100);

  const cells = [
    { label: blocks.projectBudget, value: `${totalAmount} ${displayAsset}` },
    { label: blocks.prepayRatioLabel, value: `${prepayRatio}%` },
    { label: blocks.totalPrepayable, value: `${prepayAmount} ${displayAsset}` },
    { label: blocks.currentPrepaid, value: `0 ${displayAsset}` },
    { label: blocks.budgetBalance, value: `${totalAmount} ${displayAsset}` },
    { label: blocks.prepayBalance, value: `${Math.max(0, prepayAmount)} ${displayAsset}` },
  ];

  return (
    <div className="mb-5 space-y-3 rounded-xl bg-muted/40 p-4">
      <p className="text-sm">
        {blocks.availableAsset}
        <span className="font-semibold tabular-nums">
          {totalAmount} {displayAsset}
        </span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cells.map((cell) => (
          <div key={cell.label} className="text-sm">
            <p className="text-muted-foreground">{cell.label}</p>
            <p className="font-medium tabular-nums">{cell.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MotivationBlockView({
  title,
  intro,
  items,
  projectBudget,
  walletMap,
  blocks,
}: {
  title: string;
  intro?: string;
  items: MotivationBudgetItem[];
  projectBudget?: ProjectBudgetSummary;
  walletMap: Map<string, string>;
  blocks: ReturnType<typeof useT>["proposals"]["blocks"];
}) {
  const appliedTotal = sumMotivationAmount(items);
  const appliedAsset = motivationAsset(items) || projectBudget?.asset || "";

  return (
    <ProposalSection title={title}>
      {intro?.trim() && (
        <p className="mb-4 text-sm text-muted-foreground">{intro.trim()}</p>
      )}

      <BudgetSummaryGrid projectBudget={projectBudget} blocks={blocks} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">{blocks.recipient}</th>
                  <th className="px-4 py-2.5 font-medium">{blocks.assetType}</th>
                  <th className="px-4 py-2.5 font-medium">{blocks.amountCol}</th>
                  <th className="px-4 py-2.5 font-medium">{blocks.remark}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.address ?? index}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{walletLabel(item.address, walletMap)}</td>
                    <td className="px-4 py-3">{item.assetInfo?.name ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{item.amount ?? "0"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.description?.trim() || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-right text-sm font-medium tabular-nums">
            {blocks.totalApplied
              .replace("{amount}", String(appliedTotal))
              .replace("{asset}", appliedAsset)}
          </p>
        </>
      )}
    </ProposalSection>
  );
}

export function ProposalBlockView({
  display,
  walletMap,
}: {
  display: DisplayBlock;
  walletMap: Map<string, string>;
}) {
  const t = useT();
  const blocks = t.proposals.blocks;

  if (display.kind === "preview") {
    return (
      <PreviewBlockView
        title={display.block.title ?? blocks.previewDefault}
        components={display.components}
        blocks={blocks}
      />
    );
  }

  if (display.kind === "motivation") {
    return (
      <MotivationBlockView
        title={display.block.title ?? blocks.motivationDefault}
        intro={display.intro}
        items={display.items}
        projectBudget={display.projectBudget}
        walletMap={walletMap}
        blocks={blocks}
      />
    );
  }

  return (
    <ProposalSection title={display.block.title ?? blocks.contentDefault}>
      <ProposalContentView markdown={display.markdown} />
    </ProposalSection>
  );
}
