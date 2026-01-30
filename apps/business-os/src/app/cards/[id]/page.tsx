import { notFound } from "next/navigation";

import { RunStatus } from "@/components/agent-runs/RunStatus";
import { CardDetail } from "@/components/card-detail/CardDetail";
import { RecentActivity } from "@/components/card-detail/RecentActivity";
import { CommentThread } from "@/components/comments/CommentThread";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { getFileHistory, getGitHubHistoryUrl } from "@/lib/git-history";
import { getCommentsForEntity } from "@/lib/repo/CommentReader";
import { getCommitsForCard } from "@/lib/repo/CommitReader";
import { createRepoReader } from "@/lib/repo-reader";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Phase 0: Local-only, Pete-only. No auth needed.
export default async function CardPage({ params }: PageProps) {
  const { id } = await params;
  const repoRoot = getRepoRoot();
  const reader = createRepoReader(repoRoot);
  const currentUser = await getCurrentUserServer();

  // Fetch card data
  const card = await reader.getCard(id);
  if (!card) {
    notFound();
  }

  // Fetch stage docs
  const stageDocs = await reader.getCardStageDocs(id);

  // Fetch business info
  const business = card.Business
    ? await reader.getBusiness(card.Business)
    : null;

  // Fetch git history (BOS-28)
  const cardFilePath = `docs/business-os/cards/${id}.user.md`;
  const history = await getFileHistory(repoRoot, cardFilePath);
  const githubUrl = history.length > 0 ? getGitHubHistoryUrl(cardFilePath) : undefined;

  // Fetch commits mentioning this card (MVP-F1)
  const recentActivity = await getCommitsForCard(repoRoot, id);

  // Fetch comments for this card (MVP-E1)
  const comments = await getCommentsForEntity(repoRoot, "card", id);

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

      {/* Recent activity - MVP-F1 */}
      {/* eslint-disable-next-line ds/container-widths-only-at -- BOS-33: Phase 0 layout, container at page level */}
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <RecentActivity commits={recentActivity} cardId={id} />
      </div>

      {/* Comments - MVP-E1 */}
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
