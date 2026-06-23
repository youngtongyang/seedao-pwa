import { notFound } from "next/navigation";

/**
 * Onboarding (the agent-claim game) is disabled for now — the flow isn't ready,
 * so the route 404s and users can't reach it. The UI still lives in
 * `components/sections/onboarding/*`; to re-enable, restore the Responsive shell
 * from git history (it rendered OnboardingDesktop / OnboardingMobile).
 */
export default function OnboardingPage() {
  notFound();
}
