import { ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { DesktopShell } from "@/components/layout/desktop/desktop-shell";
import { MobileShell } from "@/components/layout/mobile/mobile-shell";
import { Responsive } from "@/components/layout/responsive";
import { projectIntro } from "@/lib/mock/program";

function ProgramList() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight">SeeDAO AI 共学</h1>
        <p className="mt-2 text-muted-foreground">用 AI 打开新可能，和社区一起学、一起做。</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 电商共学课 */}
        <Link
          href="/program/ecommerce"
          className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <GraduationCap className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold group-hover:text-accent transition-colors">
              {projectIntro.title.zh}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {projectIntro.subhead.zh}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-accent">
            查看详情 <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function ProgramsIndexPage() {
  return (
    <Responsive
      desktop={
        <DesktopShell>
          <ProgramList />
        </DesktopShell>
      }
      mobile={
        <MobileShell>
          <ProgramList />
        </MobileShell>
      }
    />
  );
}
