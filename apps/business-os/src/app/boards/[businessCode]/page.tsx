import { notFound } from "next/navigation";

import { BoardView } from "@/components/board/BoardView";
import { filterCardsForBoard, orderCards } from "@/lib/board-logic";
import { getCurrentUserServer } from "@/lib/current-user";
import { getDb } from "@/lib/d1.server";
import type { Business, Lane } from "@/lib/types";
import {
  listCardsForBoard as listCardsFromD1,
  listInboxIdeas,
} from "@acme/platform-core/repositories/businessOs.server";

// BOS-D1-05 Phase 2: Edge runtime with D1 repositories
export const runtime = "edge";

// BOS-D1-05: Disable Next.js caching for board pages (real-time updates required)
export const revalidate = 0;

// TODO (BOS-D1-08): Move businesses to D1 table or derive from cards
// Temporary hard-coded business catalog (matches docs/business-os/strategy/businesses.json)
const BUSINESSES: Business[] = [
  {
    id: "PLAT",
    name: "Platform",
    description:
      "Core platform infrastructure, shared services, and developer experience",
    owner: "Pete",
    status: "active",
    created: "2026-01-28",
    tags: ["infrastructure", "dx", "monorepo"],
  },
  {
    id: "BRIK",
    name: "Brikette",
    description:
      "Multilingual e-commerce platform for hostel bookings and travel experiences",
    owner: "Pete",
    status: "active",
    created: "2026-01-28",
    tags: ["e-commerce", "travel", "i18n"],
  },
  {
    id: "BOS",
    name: "Business OS",
    description:
      "Repo-native business operating system and kanban coordination layer",
    owner: "Pete",
    status: "active",
    created: "2026-01-28",
    tags: ["workflow", "coordination", "agents"],
  },
];

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

  // Fetch ALL cards (unfiltered) and ideas from D1
  const [allCards, allIdeas] = await Promise.all([
    listCardsFromD1(db, {}),
    listInboxIdeas(db, {}),
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
      businesses={BUSINESSES}
      cardsByLane={cardsByLane}
      inboxIdeas={filteredIdeas}
      currentUser={currentUser}
    />
  );
}
