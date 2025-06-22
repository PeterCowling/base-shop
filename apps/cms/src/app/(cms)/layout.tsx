import "@/app/globals.css";
import Sidebar from "@ui/components/cms/Sidebar";
import TopBar from "@ui/components/cms/TopBar";
import type { ReactNode } from "react";

/** Server component – wraps every CMS page. */
export default function CmsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
