"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useLayout } from "@acme/platform-core/contexts/LayoutContext";
import TopBar from "@acme/ui/components/cms/TopBar.client";

import { resetConfiguratorProgress } from "@/app/cms/configurator/hooks/useConfiguratorPersistence";
import { Progress } from "@/components/atoms";

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
    <div className="relative flex min-h-dvh bg-surface-1">
      <div className="relative flex flex-1 flex-col">
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
                ? /* i18n-exempt -- CMS-1010: utility classes, not user copy */ "cms-content relative w-full px-0 py-10"
                : /* i18n-exempt -- CMS-1010: utility classes, not user copy */ "cms-content relative mx-auto w-full max-w-6xl px-6 py-10"
            }
          >
            <ChunkReloadBoundary>{children}</ChunkReloadBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
