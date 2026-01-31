import { notFound } from "next/navigation";

import { BoardView } from "@/components/board/BoardView";
import { filterCardsForBoard, orderCards } from "@/lib/board-logic";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { createRepoReader } from "@/lib/repo-reader";
import type { Lane } from "@/lib/types";

// BOS-D1-05: Prepare for Edge runtime (Cloudflare Pages deployment)
// Currently using Node runtime with RepoReader (filesystem + git)
// TODO: Migrate to D1 repositories in BOS-D1-06
export const runtime = "nodejs"; // Will change to "edge" after D1 migration

// BOS-D1-05: Disable Next.js caching for board pages (real-time updates required)
export const revalidate = 0;

interface PageProps {
  params: Promise<{ businessCode: string }>;
}

// Phase 0: Local-only, Pete-only. No auth needed.
// BOS-D1-05: Using RepoReader (git-based) until D1 migration complete
export default async function BoardPage({ params }: PageProps) {
  const { businessCode } = await params;
  const repoRoot = getRepoRoot();
  const reader = createRepoReader(repoRoot);
  const currentUser = await getCurrentUserServer();

  // Validate business code
  if (businessCode !== "global") {
    const business = await reader.getBusiness(businessCode);
    if (!business) {
      notFound();
    }
  }

  // Fetch ALL cards (unfiltered) and businesses
  const [businesses, allCards, allIdeas] = await Promise.all([
    reader.getBusinesses(),
    reader.queryCards({
      includeArchived: false,
    }),
    reader.queryIdeas({
      location: "inbox",
      includeArchived: false,
    }),
  ]);

  // BOS-14: Filter cards for this board type
  const boardType = businessCode === "global" ? "global" : "business";
  const filteredCards = filterCardsForBoard(
    allCards,
    boardType,
    businessCode === "global" ? undefined : businessCode
  );

  // Organize cards by lane
  const lanes: Lane[] = [
    "Inbox",
    "Fact-finding",
    "Planned",
    "In progress",
    "Blocked",
    "Done",
    "Reflected",
  ];

  // BOS-14: Apply computed ordering within each lane
  const cardsByLane = lanes.reduce(
    (acc, lane) => {
      const laneCards = filteredCards.filter((card) => card.Lane === lane);
      acc[lane] = orderCards(laneCards);
      return acc;
    },
    {} as Record<Lane, typeof filteredCards>
  );

  // Filter ideas for business boards (global board shows all)
  const filteredIdeas =
    businessCode === "global"
      ? allIdeas
      : allIdeas.filter((idea) => idea.Business === businessCode);

  return (
    <BoardView
      businessCode={businessCode}
      businesses={businesses}
      cardsByLane={cardsByLane}
      inboxIdeas={filteredIdeas}
      currentUser={currentUser}
    />
  );
}
