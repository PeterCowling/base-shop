"use client";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import Sidebar from "@ui/components/cms/Sidebar.client";
import TopBar from "@ui/components/cms/TopBar.client";
import type { ReactNode } from "react";
import { Progress } from "@/components/atoms";
import { resetConfiguratorProgress } from "@/app/cms/configurator/hooks/useConfiguratorPersistence";
import { cn } from "@ui/utils/style";

export default function LayoutClient({
  role,
  children,
}: {
  role?: string;
  children: ReactNode;
}) {
  const { isMobileNavOpen, configuratorProgress } = useLayout();

  return (
    <div className="relative flex min-h-screen bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.15),_transparent_55%)]" />
      <div
        className={cn(
          "relative z-10 h-full w-72 shrink-0 border-r border-white/10 bg-slate-950/80 text-white backdrop-blur-xl transition-transform duration-300",
          isMobileNavOpen
            ? "block translate-x-0"
            : "hidden -translate-x-full sm:translate-x-0 sm:block"
        )}
      >
        <Sidebar
          role={role}
          onConfiguratorStartNew={() => {
            void resetConfiguratorProgress();
          }}
        />
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        <TopBar />
        {configuratorProgress && (
          <div className="border-b border-white/10 bg-slate-900/50 px-6 py-3 backdrop-blur">
            <Progress
              value={
                (configuratorProgress.completedRequired /
                  configuratorProgress.totalRequired) *
                100
              }
              label={
                configuratorProgress.totalOptional
                  ? `${configuratorProgress.completedRequired}/${configuratorProgress.totalRequired} required, ${configuratorProgress.completedOptional}/${configuratorProgress.totalOptional} optional`
                  : `${configuratorProgress.completedRequired}/${configuratorProgress.totalRequired} required`
              }
            />
          </div>
        )}
        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.08),_transparent_45%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
