import { notFound } from "next/navigation";

import {
  listCardsForBoard as listCardsFromD1,
} from "@acme/platform-core/repositories/businessOs.server";

import { BoardView } from "@/components/board/BoardView";
import { filterCardsForBoard, orderCards } from "@/lib/board-logic";
import { BUSINESSES } from "@/lib/business-catalog";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";
import type { Lane } from "@/lib/types";

// BOS-D1-05 Phase 2: Edge runtime with D1 repositories

// BOS-D1-05: Disable Next.js caching for board pages (real-time updates required)
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ businessCode: string }>;
}

// BOS-D1-05 Phase 2: Using D1 repositories (Edge runtime)
export default async function BoardPage({ params }: PageProps) {
  const { businessCode } = await params;
  const db = getDb();
  const currentUser = await getCurrentUserServer();

  // Validate business code
  if (businessCode !== "global") {
    const business = BUSINESSES.find((b) => b.id === businessCode);
    if (!business) {
      notFound();
    }
  }

  // Fetch ALL cards (unfiltered) from D1
  const allCards = await listCardsFromD1(db, {});

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

  return (
    <BoardView
      businessCode={businessCode}
      businesses={BUSINESSES}
      cardsByLane={cardsByLane}
      currentUser={currentUser}
    />
  );
}
