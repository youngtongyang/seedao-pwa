import { HeroDesktop } from "@/components/sections/hero/hero-desktop";
import { MembershipDesktop } from "@/components/sections/membership/membership-desktop";
import { ProgramsShowcaseDesktop } from "@/components/sections/programs/programs-showcase-desktop";

export function DesktopHome() {
  return (
    <>
      <HeroDesktop />
      <MembershipDesktop />
      <ProgramsShowcaseDesktop />
    </>
  );
}
