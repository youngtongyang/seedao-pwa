import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { FeishuBindView } from "@/components/sections/profile/feishu-bind-view";
import { joinRedirectPath, loginRedirectPath } from "@/lib/auth/return-to";

export const metadata = {
  title: "绑定飞书 · Bind Feishu",
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function FeishuBindPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = (params.token || "").trim();
  const returnTo = token
    ? `/profile/bind?token=${encodeURIComponent(token)}`
    : "/profile/bind";

  const store = await cookies();
  if (!store.get("seedao.session")) {
    redirect(loginRedirectPath(returnTo));
  }
  if (!store.get("seedao.authed")) {
    redirect(joinRedirectPath(returnTo));
  }

  return (
    <Responsive
      desktop={
        <DesktopShell>
          <Suspense fallback={null}>
            <FeishuBindView />
          </Suspense>
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <Suspense fallback={null}>
            <FeishuBindView />
          </Suspense>
        </MobileShell>
      }
    />
  );
}
