// apps/cms/src/app/cms/layout.tsx
import "../globals.css";

import { authOptions } from "@cms/auth/options";
import { LayoutProvider } from "@platform-core/contexts/LayoutContext";
import { getServerSession } from "next-auth";
import LayoutClient from "./LayoutClient.client";

import type { ReactNode } from "react";

/** Server component – wraps every CMS page. */
export default async function CmsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <LayoutProvider>
      <LayoutClient role={session?.user.role}>{children}</LayoutClient>
    </LayoutProvider>
  );
}
