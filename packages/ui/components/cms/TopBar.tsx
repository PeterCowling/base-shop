// packages/ui/components/cms/TopBar.tsx
"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "../ui/button";
import Breadcrumbs from "./Breadcrumbs";

function TopBarInner() {
  const router = useRouter();

  return (
    <header className="bg-background/60 flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2 backdrop-blur dark:border-gray-800">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.refresh()}>
          Refresh
        </Button>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/cms/login" })}
        >
          Sign&nbsp;out
        </Button>
      </div>
    </header>
  );
}

export default memo(TopBarInner);
