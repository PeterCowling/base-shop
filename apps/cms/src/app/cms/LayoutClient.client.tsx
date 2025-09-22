"use client";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import Sidebar from "@ui/components/cms/Sidebar.client";
import TopBar from "@ui/components/cms/TopBar.client";
import type { ReactNode } from "react";
import { Progress } from "@/components/atoms";
import { resetConfiguratorProgress } from "@/app/cms/configurator/hooks/useConfiguratorPersistence";
import { cn } from "@ui/utils/style";
import ChunkReloadBoundary from "./ChunkReloadBoundary.client";

export default function LayoutClient({
  role,
  children,
}: {
  role?: string;
  children: ReactNode;
}) {
  const { isMobileNavOpen, configuratorProgress } = useLayout();

  return (
    <div className="relative flex min-h-screen bg-surface-1">
      <div
        className={cn(
          "relative z-10 h-full w-72 shrink-0 border-r border-border-1 bg-gradient-to-b from-surface-2 to-surface-3 text-foreground shadow-elevation-2 transition-transform duration-300",
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
          <div className="border-b border-border/10 bg-surface-2 px-6 py-3">
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
          <div className="cms-content relative mx-auto w-full max-w-6xl px-6 py-10">
            <ChunkReloadBoundary>{children}</ChunkReloadBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
