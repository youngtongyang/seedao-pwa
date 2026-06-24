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
  // Gate: members only. `seedao.authed` is set only for an active paid member;
  // a registered-but-unpaid user has a session token but no `authed`, so send
  // them to finish payment. A user with neither goes to log in.
  const store = await cookies();
  if (!store.get("seedao.authed")) {
    redirect(store.get("seedao.session") ? "/?join=1#membership" : "/login");
  }

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
