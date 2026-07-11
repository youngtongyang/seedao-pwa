import type { ReactNode } from "react";
import { PaymentResumeRedirect } from "@/components/auth/payment-resume-redirect";
import { HelpFab } from "@/components/help/help-fab";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function DesktopShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PaymentResumeRedirect />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <HelpFab className="bottom-6 right-6" />
    </div>
  );
}
