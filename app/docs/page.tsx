import { DocsDesktop } from "@/components/sections/docs/docs-desktop";
import { DocsMobile } from "@/components/sections/docs/docs-mobile";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";

export const metadata = {
  title: "社区文档 · Docs",
};

export default function DocsPage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <DocsDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <DocsMobile />
        </MobileShell>
      }
    />
  );
}
