"use client";

import { QRFrame } from "@/components/shared/qr-frame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { JoinFlow, StepHeading, usePendingJoin } from "./join-flow";

export function PaymentPanel({ className }: { className?: string }) {
  const t = useT();
  // A returning H5 payer comes back with a stashed order — default to the Join
  // tab and resume polling. Re-key so the new default applies post-hydration.
  const pending = usePendingJoin();

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-border bg-card p-7",
        className,
      )}
    >
      <Tabs defaultValue={pending ? "join" : "spectate"} key={pending?.order_no ?? "default"}>
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
          <JoinFlow initialPending={pending} />
        </TabsContent>
      </Tabs>
    </div>
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
