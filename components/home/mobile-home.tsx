import { ClosingCTA } from "@/components/sections/cta/closing-cta";
import { CommunityMobile } from "@/components/sections/community/community-mobile";
import { HeroMobile } from "@/components/sections/hero/hero-mobile";
import { MembershipMobile } from "@/components/sections/membership/membership-mobile";
import { RulesMobile } from "@/components/sections/rules/rules-mobile";

export function MobileHome() {
  return (
    <>
      <HeroMobile />
      <CommunityMobile />
      <MembershipMobile />
      <RulesMobile />
      <ClosingCTA />
    </>
  );
}
