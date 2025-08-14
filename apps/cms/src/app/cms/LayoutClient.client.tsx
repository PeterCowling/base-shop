"use client";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import Sidebar from "@ui/components/cms/Sidebar.client";
import TopBar from "@ui/components/cms/TopBar.client";
import type { ReactNode } from "react";
import { Progress } from "@/components/atoms";

export default function LayoutClient({
  role,
  children,
}: {
  role?: string;
  children: ReactNode;
}) {
  const { isMobileNavOpen, configuratorProgress } = useLayout();
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div
        className={`${
          isMobileNavOpen ? "block" : "hidden"
        } absolute z-20 h-full sm:static sm:block`}
      >
        <Sidebar role={role} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        {configuratorProgress && (
          <div className="border-b border-muted px-4 py-2">
            <Progress
              value={
                (configuratorProgress.completedRequired /
                  configuratorProgress.totalRequired) *
                100
              }
              label={`${configuratorProgress.completedRequired}/${configuratorProgress.totalRequired} required${
                configuratorProgress.totalOptional
                  ? `, ${configuratorProgress.completedOptional}/${configuratorProgress.totalOptional} optional`
                  : ""
              }`}
            />
          </div>
        )}
        <main className="@container flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
