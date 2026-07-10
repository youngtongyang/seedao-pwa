import { ProposalDetailView } from "@/components/sections/proposals/proposal-detail-view";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";

export const metadata = {
  title: "提案详情 · Proposal",
};

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProposalDetailView id={id} />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProposalDetailView id={id} />
        </MobileShell>
      }
    />
  );
}
