import { notFound } from "next/navigation";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { ProgramDesktop } from "@/components/sections/program/program-desktop";
import { ProgramMobile } from "@/components/sections/program/program-mobile";
import { getProgram } from "@/lib/mock/programs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const program = getProgram(slug);
  // metadata 无法跟随客户端语言切换，取站点默认语言 zh
  return program ? { title: program.title.zh } : {};
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  // Program 记录含 LucideIcon（函数），不能跨 RSC 边界传递 —— 只传 slug，
  // 客户端组件自行从注册表解析
  if (!getProgram(slug)) notFound();

  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProgramDesktop slug={slug} />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProgramMobile slug={slug} />
        </MobileShell>
      }
    />
  );
}
