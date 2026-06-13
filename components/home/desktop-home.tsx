import { ClosingCTA } from "@/components/sections/cta/closing-cta";
import { CommunityDesktop } from "@/components/sections/community/community-desktop";
import { HeroDesktop } from "@/components/sections/hero/hero-desktop";
import { MembershipDesktop } from "@/components/sections/membership/membership-desktop";
import { RulesDesktop } from "@/components/sections/rules/rules-desktop";

export function DesktopHome() {
  return (
    <>
      <HeroDesktop />
      <CommunityDesktop />
      <MembershipDesktop />
      <RulesDesktop />
      <ClosingCTA />
    </>
  );
}
