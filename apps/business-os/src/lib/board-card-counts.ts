/**
 * Board Card Counting Utilities
 * Helper functions for counting cards and ideas per lane
 * Extracted from BoardView to reduce component complexity
 * BOS-UX-10
 */

import type { Card, Idea, Lane } from "./types";

/**
 * Calculate card and idea counts for each lane
 * Used for mobile lane picker badge display
 */
export function calculateCardCountsByLane(
  allLanes: Lane[],
  cardsByLane: Record<Lane, Card[]>,
  inboxIdeas: Idea[]
): Record<Lane, number> {
  const counts: Record<Lane, number> = {} as Record<Lane, number>;

  allLanes.forEach((lane) => {
    const laneCards = cardsByLane[lane] || [];
    const laneIdeas = lane === "Inbox" ? inboxIdeas : [];
    counts[lane] = laneCards.length + laneIdeas.length;
  });

  return counts;
}
