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

function RelateSection({ data }: { data: Record<string, unknown> }) {
  const relate = String(data.relate ?? "");
  const proposalId = Number(data.proposal_id);
  const href = Number.isFinite(proposalId) ? `/proposals/${proposalId}` : undefined;

  return (
    <SubSection title="立项提案">
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

function BudgetSection({ data }: { data: Record<string, unknown> }) {
  const list =
    (data.budgetList as Array<{
      amount?: string;
      description?: string;
      proportion?: string;
      typeTest?: { name?: string };
    }>) ?? [];
  if (!list.length) return null;

  return (
    <SubSection title="预算申请">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">申请数额</th>
              <th className="px-4 py-2.5 font-medium">资产类型</th>
              <th className="px-4 py-2.5 font-medium">预付比例 (0–50%)</th>
              <th className="px-4 py-2.5 font-medium">预付需求说明</th>
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

function DeliverablesSection({ data }: { data: Record<string, unknown> }) {
  const text = String(data.description ?? "").trim();
  if (!text) return null;
  return (
    <SubSection title="交付物">
      <FieldBox className="whitespace-pre-wrap">{text}</FieldBox>
    </SubSection>
  );
}

function DeadlineSection({ data }: { data: Record<string, unknown> }) {
  const value = String(data.description ?? "").trim();
  if (!value) return null;
  return (
    <SubSection title="计划完成时限">
      <FieldBox>{formatDeadline(value)}</FieldBox>
    </SubSection>
  );
}

function PreviewBlockView({ title, components }: { title: string; components: PreviewComponent[] }) {
  const byName = Object.fromEntries(components.filter((c) => c.name).map((c) => [c.name!, c]));

  return (
    <ProposalSection title={title}>
      <div className="space-y-5">
        {byName.relate && <RelateSection data={byName.relate.data ?? {}} />}
        {byName.budget && <BudgetSection data={byName.budget.data ?? {}} />}
        {byName.deliverables && <DeliverablesSection data={byName.deliverables.data ?? {}} />}
        {byName.deadline && <DeadlineSection data={byName.deadline.data ?? {}} />}
      </div>
    </ProposalSection>
  );
}

function BudgetSummaryGrid({ projectBudget }: { projectBudget?: ProjectBudgetSummary }) {
  if (!projectBudget) return null;

  const { totalAmount, asset, prepayRatio } = projectBudget;
  const displayAsset = formatBudgetSummaryAsset(asset);
  const prepayAmount = Math.round((totalAmount * prepayRatio) / 100);

  const cells = [
    { label: "项目预算", value: `${totalAmount} ${displayAsset}` },
    { label: "预付比例", value: `${prepayRatio}%` },
    { label: "总可预支", value: `${prepayAmount} ${displayAsset}` },
    { label: "当前已预支", value: `0 ${displayAsset}` },
    { label: "预算余额", value: `${totalAmount} ${displayAsset}` },
    { label: "可预支余额", value: `${Math.max(0, prepayAmount)} ${displayAsset}` },
  ];

  return (
    <div className="mb-5 space-y-3 rounded-xl bg-muted/40 p-4">
      <p className="text-sm">
        当前可申请资产：
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
}: {
  title: string;
  intro?: string;
  items: MotivationBudgetItem[];
  projectBudget?: ProjectBudgetSummary;
  walletMap: Map<string, string>;
}) {
  const appliedTotal = sumMotivationAmount(items);
  const appliedAsset = motivationAsset(items) || projectBudget?.asset || "";

  return (
    <ProposalSection title={title}>
      {intro?.trim() && (
        <p className="mb-4 text-sm text-muted-foreground">{intro.trim()}</p>
      )}

      <BudgetSummaryGrid projectBudget={projectBudget} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">接收人</th>
                  <th className="px-4 py-2.5 font-medium">资产类型</th>
                  <th className="px-4 py-2.5 font-medium">资产数量</th>
                  <th className="px-4 py-2.5 font-medium">备注</th>
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
            申请总资产：{appliedTotal} {appliedAsset}
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
  if (display.kind === "preview") {
    return (
      <PreviewBlockView
        title={display.block.title ?? "立项信息"}
        components={display.components}
      />
    );
  }

  if (display.kind === "motivation") {
    return (
      <MotivationBlockView
        title={display.block.title ?? "激励申请表"}
        intro={display.intro}
        items={display.items}
        projectBudget={display.projectBudget}
        walletMap={walletMap}
      />
    );
  }

  return (
    <ProposalSection title={display.block.title ?? "内容"}>
      <ProposalContentView markdown={display.markdown} />
    </ProposalSection>
  );
}
