import { ProposalsDesktop } from "@/components/sections/proposals/proposals-desktop";
import { ProposalsMobile } from "@/components/sections/proposals/proposals-mobile";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";

export const metadata = {
  title: "提案 · Proposals",
};

export default function ProposalsPage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProposalsDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProposalsMobile />
        </MobileShell>
      }
    />
  );
}
