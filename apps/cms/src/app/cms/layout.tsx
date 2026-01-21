// apps/cms/src/app/cms/layout.tsx
import "../globals.css";

import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { LayoutProvider } from "@acme/platform-core/contexts/LayoutContext";

import LayoutClient from "./LayoutClient.client";
import CmsSessionProvider from "./SessionProvider.client";

/** Server component – wraps every CMS page. */
export default async function CmsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <LayoutProvider>
      <CmsSessionProvider session={session}>
        <LayoutClient role={session?.user.role}>{children}</LayoutClient>
      </CmsSessionProvider>
    </LayoutProvider>
  );
}
