import { ClosingCTA } from "@/components/sections/cta/closing-cta";
import { HeroMobile } from "@/components/sections/hero/hero-mobile";
import { MembershipMobile } from "@/components/sections/membership/membership-mobile";

export function MobileHome() {
  return (
    <>
      <HeroMobile />
      <MembershipMobile />
      <ClosingCTA />
    </>
  );
}
