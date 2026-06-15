import { ClosingCTA } from "@/components/sections/cta/closing-cta";
import { HeroDesktop } from "@/components/sections/hero/hero-desktop";
import { MembershipDesktop } from "@/components/sections/membership/membership-desktop";

export function DesktopHome() {
  return (
    <>
      <HeroDesktop />
      <MembershipDesktop />
      <ClosingCTA />
    </>
  );
}
