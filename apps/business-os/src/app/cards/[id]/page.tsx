import { notFound } from "next/navigation";

import {
  getCardById,
  listStageDocsForCard,
} from "@acme/platform-core/repositories/businessOs.server";

import { RunStatus } from "@/components/agent-runs/RunStatus";
import { CardDetail } from "@/components/card-detail/CardDetail";
import { RecentActivity } from "@/components/card-detail/RecentActivity";
import { CommentThread } from "@/components/comments/CommentThread";
import { BUSINESSES } from "@/lib/business-catalog";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";

// BOS-D1-05 Phase 2: Edge runtime with D1 repositories

// BOS-D1-05: Cache card detail pages (1 minute acceptable for detail views)
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// BOS-D1-05 Phase 2: Using D1 repositories (Edge runtime)
export default async function CardPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  const currentUser = await getCurrentUserServer();

  // Fetch card data from D1
  const card = await getCardById(db, id);
  if (!card) {
    notFound();
  }

  // Fetch stage docs from D1
  const stageDocsArray = await listStageDocsForCard(db, id);

  // Transform stage docs array into object format expected by CardDetail
  const stageDocs = {
    factFind: stageDocsArray.find((doc) => doc.Stage === "fact-find"),
    plan: stageDocsArray.find((doc) => doc.Stage === "plan"),
    build: stageDocsArray.find((doc) => doc.Stage === "build"),
    reflect: stageDocsArray.find((doc) => doc.Stage === "reflect"),
  };

  // Get business info from hard-coded catalog
  const business = card.Business
    ? BUSINESSES.find((b) => b.id === card.Business) ?? null
    : null;

  // TODO (BOS-D1-09): Re-enable git history via git mirror or D1 metadata
  const history: never[] = [];
  const githubUrl = undefined;

  // TODO (BOS-D1-09): Re-enable recent activity via D1 audit log
  const recentActivity: never[] = [];

  // TODO (BOS-D1-06): Re-enable comments via D1 comments table
  const comments: never[] = [];

  return (
    <>
      {/* Agent run status - MVP-E4 */}
      {/* eslint-disable-next-line ds/container-widths-only-at -- BOS-33: Phase 0 layout, container at page level */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <RunStatus entityId={id} taskId={undefined} />
      </div>

      <CardDetail
        card={card}
        stageDocs={stageDocs}
        business={business}
        currentUser={currentUser}
        history={history}
        githubUrl={githubUrl}
      />

      {/* Recent activity - MVP-F1 - Disabled during D1 migration */}
      {/* eslint-disable-next-line ds/container-widths-only-at -- BOS-33: Phase 0 layout, container at page level */}
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <RecentActivity commits={recentActivity} cardId={id} />
      </div>

      {/* Comments - MVP-E1 - Disabled during D1 migration */}
      {/* eslint-disable-next-line ds/container-widths-only-at -- BOS-33: Phase 0 layout, container at page level */}
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <CommentThread
          comments={comments}
          entityType="card"
          entityId={id}
          currentUserName={currentUser.name}
        />
      </div>
    </>
  );
}
