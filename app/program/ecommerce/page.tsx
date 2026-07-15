import type { Metadata } from "next";
import { ProgramDesktop } from "@/components/sections/program/program-desktop";
import { ProgramMobile } from "@/components/sections/program/program-mobile";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";

export const metadata: Metadata = {
  title: "30天做跨境电商，发展AI第二副业 | SeeDAO AI 共学课",
};

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
