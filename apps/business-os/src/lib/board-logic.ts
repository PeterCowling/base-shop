import type { Card, Priority } from "./types";

/**
 * Board filtering and ordering logic
 * BOS-14: Implements global board filtering and computed ordering
 */

/**
 * Filter cards for a specific board type
 *
 * @param cards - All cards to filter
 * @param boardType - Either "global" or "business"
 * @param businessCode - Required for business boards, ignored for global
 * @returns Filtered cards
 */
export function filterCardsForBoard(
  cards: Card[],
  boardType: "global" | "business",
  businessCode?: string
): Card[] {
  if (boardType === "global") {
    // Global board: only P0 and P1 priority cards
    return cards.filter(
      (card) => card.Priority === "P0" || card.Priority === "P1"
    );
  }

  // Business board: all cards for that business
  if (!businessCode) {
    throw new Error("businessCode is required for business board type");
  }

  return cards.filter((card) => card.Business === businessCode);
}

/**
 * Order cards by computed priority
 *
 * Ordering rules:
 * 1. Priority (P0 → P5, where P0 is highest)
 * 2. Due date (earliest first, cards with due dates before those without)
 * 3. Last updated (newest first)
 * 4. Created (newest first)
 * 5. ID (alphabetical, as tiebreaker)
 *
 * @param cards - Cards to order
 * @returns Sorted cards (does not mutate input)
 */
export function orderCards(cards: Card[]): Card[] {
  const priorityOrder: Record<Priority, number> = {
    P0: 0,
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4,
    P5: 5,
  };

  return [...cards].sort((a, b) => {
    // 1. Priority (P0 is highest)
    const priorityDiff = priorityOrder[a.Priority] - priorityOrder[b.Priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 2. Due date (earliest first, cards with due dates come before those without)
    if (a["Due-Date"] && b["Due-Date"]) {
      const dateDiff =
        new Date(a["Due-Date"]).getTime() - new Date(b["Due-Date"]).getTime();
      if (dateDiff !== 0) return dateDiff;
    } else if (a["Due-Date"]) {
      return -1; // a has due date, b doesn't
    } else if (b["Due-Date"]) {
      return 1; // b has due date, a doesn't
    }

    // 3. Last updated (newest first)
    if (a.Updated && b.Updated) {
      const updatedDiff =
        new Date(b.Updated).getTime() - new Date(a.Updated).getTime();
      if (updatedDiff !== 0) return updatedDiff;
    } else if (a.Updated) {
      return -1; // a has updated, b doesn't
    } else if (b.Updated) {
      return 1; // b has updated, a doesn't
    }

    // 4. Created (newest first)
    if (a.Created && b.Created) {
      const createdDiff =
        new Date(b.Created).getTime() - new Date(a.Created).getTime();
      if (createdDiff !== 0) return createdDiff;
    } else if (a.Created) {
      return -1;
    } else if (b.Created) {
      return 1;
    }

    // 5. Fallback: alphabetical by ID
    return a.ID.localeCompare(b.ID);
  });
}

/**
 * Helper: Check if a card should appear on global board
 */
export function isGlobalBoardCard(card: Card): boolean {
  return card.Priority === "P0" || card.Priority === "P1";
}

/**
 * Helper: Get board title
 */
export interface BoardTitleLabels {
  global: string;
  businessFallback: string;
}

export function getBoardTitle(
  boardType: "global" | "business",
  labels: BoardTitleLabels,
  businessName?: string
): string {
  if (boardType === "global") {
    return labels.global;
  }
  return businessName || labels.businessFallback;
}
