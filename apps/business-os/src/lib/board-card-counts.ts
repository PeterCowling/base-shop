/**
 * Board Card Counting Utilities
 * Helper functions for counting cards per lane
 * Extracted from BoardView to reduce component complexity
 * BOS-UX-10
 */

import type { Card, Lane } from "./types";

/**
 * Calculate card counts for each lane
 * Used for mobile lane picker badge display
 */
export function calculateCardCountsByLane(
  allLanes: Lane[],
  cardsByLane: Record<Lane, Card[]>
): Record<Lane, number> {
  const counts: Record<Lane, number> = {} as Record<Lane, number>;

  allLanes.forEach((lane) => {
    const laneCards = cardsByLane[lane] || [];
    counts[lane] = laneCards.length;
  });

  return counts;
}
