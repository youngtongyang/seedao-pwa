import { DesktopHome } from "@/components/home/desktop-home";
import { MobileHome } from "@/components/home/mobile-home";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";

export default function HomePage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <DesktopHome />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <MobileHome />
        </MobileShell>
      }
    />
  );
}
