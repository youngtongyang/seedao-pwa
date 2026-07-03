import { ProgramDesktop } from "@/components/sections/program/program-desktop";
import { ProgramMobile } from "@/components/sections/program/program-mobile";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";

export default function ProgramEcommercePage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProgramDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProgramMobile />
        </MobileShell>
      }
    />
  );
}
