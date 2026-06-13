import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { LoginDesktop } from "@/components/sections/login/login-desktop";
import { LoginMobile } from "@/components/sections/login/login-mobile";

export const metadata = {
  title: "登录 · Log in",
};

export default function LoginPage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <LoginDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <LoginMobile />
        </MobileShell>
      }
    />
  );
}
