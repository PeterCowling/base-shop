"use client";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import { usePathname } from "next/navigation";
import TopBar from "@ui/components/cms/TopBar.client";
import type { ReactNode } from "react";
import { Progress } from "@/components/atoms";
import { resetConfiguratorProgress } from "@/app/cms/configurator/hooks/useConfiguratorPersistence";
import ChunkReloadBoundary from "./ChunkReloadBoundary.client";

export default function LayoutClient({
  role,
  children,
}: {
  role?: string;
  children: ReactNode;
}) {
  const { configuratorProgress } = useLayout();
  const pathname = usePathname();
  const isBuilder = typeof pathname === "string" && pathname.includes("/builder");

  return (
    <div className="relative flex min-h-screen bg-surface-1">
      <div className="relative z-10 flex flex-1 flex-col">
        <TopBar role={role} onConfiguratorStartNew={resetConfiguratorProgress} />
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
          <div
            className={
              // Builder pages use a full-bleed content wrapper so the left rail can
              // align relative to the viewport instead of the centered container.
              // Other CMS pages remain centered with max width + padding.
              isBuilder
                ? "cms-content relative w-full px-0 py-10"
                : "cms-content relative mx-auto w-full max-w-6xl px-6 py-10"
            }
          >
            <ChunkReloadBoundary>{children}</ChunkReloadBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
