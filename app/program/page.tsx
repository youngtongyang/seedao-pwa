import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { ProgramsIndexDesktop } from "@/components/sections/programs/programs-index-desktop";
import { ProgramsIndexMobile } from "@/components/sections/programs/programs-index-mobile";

export default function ProgramsIndexPage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProgramsIndexDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProgramsIndexMobile />
        </MobileShell>
      }
    />
  );
}
