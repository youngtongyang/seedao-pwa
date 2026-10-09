import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProposalCreateView } from "@/components/sections/proposals/proposal-create-view";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { Loader2 } from "lucide-react";
import { joinRedirectPath, loginRedirectPath } from "@/lib/auth/return-to";

export const metadata = {
  title: "创建提案 · Create Proposal",
};

function CreateFallback() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export default async function ProposalCreatePage() {
  const store = await cookies();
  const returnTo = "/proposals/new";
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
          <Suspense fallback={<CreateFallback />}>
            <ProposalCreateView />
          </Suspense>
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <Suspense fallback={<CreateFallback />}>
            <ProposalCreateView />
          </Suspense>
        </MobileShell>
      }
    />
  );
}
