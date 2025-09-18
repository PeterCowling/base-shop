import { listPendingUsers } from "@cms/actions/accounts.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { collectStats } from "@cms/lib/dashboardData";
import { DashboardHero } from "@cms/components/DashboardHero";
import { ShopOverviewCard } from "@cms/components/ShopOverviewCard";
import { PendingSummaryPanel } from "@cms/components/PendingSummaryPanel";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PendingRequestsPanel } from "./components/PendingRequestsPanel";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

export const revalidate = 0;

const PENDING_HEADING_ID = "cms-pending-requests";

export default async function CmsDashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await collectStats();

  const canManageRequests = session?.user.role === "admin";
  const pending = canManageRequests ? await listPendingUsers() : [];
  const pendingCount = pending.length;

  const roles: Role[] = [
    "admin",
    "viewer",
    "ShopAdmin",
    "CatalogManager",
    "ThemeEditor",
  ];

  return (
    <div className="space-y-10">
      <DashboardHero
        stats={stats}
        pendingCount={pendingCount}
        canManageRequests={canManageRequests}
        pendingHeadingId={PENDING_HEADING_ID}
      />

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <ShopOverviewCard stats={stats} pendingCount={pendingCount} />

        {canManageRequests ? (
          <PendingRequestsPanel
            pending={pending}
            roles={roles}
            headingId={PENDING_HEADING_ID}
          />
        ) : (
          <PendingSummaryPanel headingId={PENDING_HEADING_ID} />
        )}
      </section>
    </div>
  );
}
