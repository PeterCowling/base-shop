// apps/cms/src/app/cms/layout.tsx
import "../globals.css";

import { LayoutProvider } from "@platform-core/contexts/LayoutContext";
import Sidebar from "@ui/components/cms/Sidebar";
import TopBar from "@ui/components/cms/TopBar";

import type { ReactNode } from "react";

/** Server component – wraps every CMS page. */
export default function CmsLayout({ children }: { children: ReactNode }) {
  return (
    <LayoutProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="@container flex-1 overflow-y-auto p-6">
            {children}
          </main>{" "}
        </div>
      </div>
    </LayoutProvider>
  );
}
