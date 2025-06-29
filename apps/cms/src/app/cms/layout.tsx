// apps/cms/src/app/cms/layout.tsx
import "../globals.css";

import { authOptions } from "@cms/auth/options";
import { LayoutProvider } from "@platform-core/contexts/LayoutContext";
import Sidebar from "@ui/components/cms/Sidebar";
import TopBar from "@ui/components/cms/TopBar";
import { getServerSession } from "next-auth";

import type { ReactNode } from "react";

/** Server component – wraps every CMS page. */
export default async function CmsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <LayoutProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar role={session?.user.role} />
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
