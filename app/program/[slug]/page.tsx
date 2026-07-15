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
  if (!getProgram(slug)) notFound();

  // 课程详情 UI 目前由 main 侧统一为无 slug 的静态内容；
  // /program/ecommerce 为正式入口，[slug] 仅做存在性校验后复用同一套组件。
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProgramDesktop />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProgramMobile />
        </MobileShell>
      }
    />
  );
}
