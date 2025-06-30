"use client";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import Sidebar from "@ui/components/cms/Sidebar.client";
import TopBar from "@ui/components/cms/TopBar.client";
import type { ReactNode } from "react";

export default function LayoutClient({
  role,
  children,
}: {
  role?: string;
  children: ReactNode;
}) {
  const { isMobileNavOpen } = useLayout();
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
        <main className="@container flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
