// src/routes/how-to-get-here/pickBestLink.ts
// Utility for finding the best route link based on user preferences

import type { RoutePickerSelection } from "./components/RoutePicker";
import type { AugmentedDestinationLink, TransportMode } from "./types";

/**
 * Scores a transport mode based on user preference.
 * Lower scores are better.
 */
export function scoreTransportMode(
  mode: TransportMode,
  preference: RoutePickerSelection["preference"]
): number {
  switch (preference) {
    case "fastest":
      return mode === "car" ? 0 : mode === "ferry" ? 1 : mode === "train" ? 2 : mode === "bus" ? 3 : 4;
    case "cheapest":
      return mode === "walk" ? 0 : mode === "bus" ? 1 : mode === "train" ? 2 : mode === "ferry" ? 3 : 4;
    case "least-walking":
      return mode === "car" ? 0 : mode === "train" ? 1 : mode === "bus" ? 2 : mode === "ferry" ? 3 : 4;
    case "luggage-friendly":
      return mode === "car" ? 0 : mode === "train" ? 1 : mode === "bus" ? 2 : mode === "ferry" ? 3 : 4;
    default:
      return 0;
  }
}

/**
 * Picks the best route link from a list based on the user's selection criteria.
 * Prefers "to" direction routes. Applies penalties for transfers and late-night ferry.
 */
export function pickBestLink(
  links: AugmentedDestinationLink[],
  selection: RoutePickerSelection
): AugmentedDestinationLink | null {
  // Prefer "to" direction routes (going to the hostel)
  const candidates = links.filter((link) => link.direction === "to");
  const pool = candidates.length > 0 ? candidates : links;

  let best: AugmentedDestinationLink | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const link of pool) {
    const modeScore = link.transportModes.reduce(
      (sum, mode) => sum + scoreTransportMode(mode, selection.preference),
      0
    );
    // Penalty for transfers (each additional mode adds complexity)
    const transferPenalty = Math.max(0, link.transportModes.length - 1) * 2;
    // Late-night ferry is unreliable, add penalty
    const lateNightPenalty =
      selection.arrival === "late-night" && link.transportModes.includes("ferry") ? 10 : 0;
    const score = modeScore + transferPenalty + lateNightPenalty;

    if (score < bestScore) {
      bestScore = score;
      best = link;
    }
  }

  return best;
}
