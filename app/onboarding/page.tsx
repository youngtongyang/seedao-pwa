import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { OnboardingDesktop } from "@/components/sections/onboarding/onboarding-desktop";
import { OnboardingMobile } from "@/components/sections/onboarding/onboarding-mobile";

export const metadata = {
  title: "新手上路 · Get Started",
};

export default function OnboardingPage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <OnboardingDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <OnboardingMobile />
        </MobileShell>
      }
    />
  );
}
