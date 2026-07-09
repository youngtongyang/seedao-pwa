import { HeroMobile } from "@/components/sections/hero/hero-mobile";
import { MembershipMobile } from "@/components/sections/membership/membership-mobile";
import { ProgramsShowcaseMobile } from "@/components/sections/programs/programs-showcase-mobile";

export function MobileHome() {
  return (
    <>
      <HeroMobile />
      <MembershipMobile />
      <ProgramsShowcaseMobile />
    </>
  );
}
