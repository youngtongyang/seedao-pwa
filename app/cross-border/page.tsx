import { CrossBorderDesktop } from "@/components/sections/cross-border/cross-border-desktop";
import { CrossBorderMobile } from "@/components/sections/cross-border/cross-border-mobile";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";

export default function CrossBorderPage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <CrossBorderDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <CrossBorderMobile />
        </MobileShell>
      }
    />
  );
}
