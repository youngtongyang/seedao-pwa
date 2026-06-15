import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { ProfileView } from "@/components/sections/profile/profile-view";

export const metadata = {
  title: "个人主页 · Profile",
};

export default async function ProfilePage() {
  // Gate: only reachable after a successful login established the session.
  const session = (await cookies()).get("seedao.session");
  if (!session) redirect("/login");

  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProfileView />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProfileView />
        </MobileShell>
      }
    />
  );
}
