import type { ReactNode } from "react";
import { PaymentResumeRedirect } from "@/components/auth/payment-resume-redirect";
import { HelpFab } from "@/components/help/help-fab";
import { BottomNav } from "./bottom-nav";
import { MobileHeader } from "./mobile-header";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PaymentResumeRedirect />
      <MobileHeader />
      {/* pad bottom for the tab bar */}
      <main className="flex-1 pb-24">{children}</main>
      <HelpFab className="bottom-24 right-4" />
      <BottomNav />
    </div>
  );
}
