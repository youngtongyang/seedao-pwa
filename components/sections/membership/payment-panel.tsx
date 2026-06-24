"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRFrame } from "@/components/shared/qr-frame";
import { useAccount } from "@/lib/account";
import { useT } from "@/lib/i18n";
import type { PendingOrder } from "@/lib/payment/client";
import { cn } from "@/lib/utils";
import { JoinFlow, StepHeading, useJoinIntent, usePendingJoin } from "./join-flow";

// The wallet stack (wagmi) loads only when the on-chain SNS option is opened —
// Radix mounts inactive tab content lazily, so the chunk is fetched on click.
const WalletLogin = dynamic(() => import("../login/wallet-login"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-10">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function PaymentPanel({ className }: { className?: string }) {
  const t = useT();
  // Open the Join tab when a returning H5 payer comes back with a stashed order,
  // or when sent here from the login page (`?join=1`). Re-key so the new default
  // applies post-hydration.
  const pending = usePendingJoin();
  const joinIntent = useJoinIntent();
  const openJoin = !!pending || joinIntent;

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-border bg-card p-7",
        className,
      )}
    >
      <Tabs defaultValue={openJoin ? "join" : "spectate"} key={`${openJoin}:${pending?.order_no ?? ""}`}>
        <TabsList className="mx-auto flex w-full max-w-xs">
          <TabsTrigger value="spectate" className="flex-1">
            {t.membership.tabSpectate}
          </TabsTrigger>
          <TabsTrigger value="join" className="flex-1">
            {t.membership.tabJoin}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spectate">
          <SpectatePanel />
        </TabsContent>
        <TabsContent value="join">
          <JoinOptions pending={pending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── 加入 (join) — new SNS, or claim an existing on-chain one ─────────────────────

function JoinOptions({ pending }: { pending: PendingOrder | null }) {
  const t = useT();
  const account = useAccount();
  // A signed-in user without active membership just needs to pay — open the New
  // flow straight at the QR step. Captured at hydration so it doesn't re-trigger
  // mid-flow (a fresh registrant proceeds to pay via the normal step change).
  const resumePay = useMemo(
    () => account.hydrated && !!account.user && !account.isMember,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.hydrated],
  );

  return (
    <Tabs defaultValue="new" className="text-center">
      <TabsList className="mx-auto mt-4 flex w-full max-w-xs">
        <TabsTrigger value="new" className="flex-1">
          {t.membership.joinNewTab}
        </TabsTrigger>
        <TabsTrigger value="existing" className="flex-1">
          {t.membership.joinExistingTab}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <JoinFlow
          key={`${resumePay}:${pending?.order_no ?? ""}`}
          initialPending={pending}
          resumePay={resumePay}
          resumeSnsName={account.user?.sns_name}
        />
      </TabsContent>
      <TabsContent value="existing">
        <WalletLogin />
      </TabsContent>
    </Tabs>
  );
}

// ── 围观 (look around) ──────────────────────────────────────────────────────────

function SpectatePanel() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <StepHeading title={t.membership.spectateTitle} desc={t.membership.spectateDesc} />
      <QRFrame src="/qr/feishu-group.svg" alt={t.membership.spectateQrAlt} size={172} withBadge={false} />
      <p className="text-sm text-muted-foreground">{t.membership.spectateQrHint}</p>
    </div>
  );
}
