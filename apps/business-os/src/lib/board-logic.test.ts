import { describe, expect, it } from "@jest/globals";

import {
  filterCardsForBoard,
  getBoardTitle,
  isGlobalBoardCard,
  orderCards,
} from "./board-logic";
import type { Card } from "./types";

describe("board-logic", () => {
  describe("filterCardsForBoard", () => {
    const testCards: Card[] = [
      {
        Type: "Card",
        ID: "BRIK-OPP-0001",
        Lane: "In progress",
        Priority: "P0",
        Owner: "Pete",
        Business: "BRIK",
        Created: "2026-01-28",
        content: "Test",
        filePath: "test",
      },
      {
        Type: "Card",
        ID: "BRIK-OPP-0002",
        Lane: "Inbox",
        Priority: "P1",
        Owner: "Pete",
        Business: "BRIK",
        Created: "2026-01-28",
        content: "Test",
        filePath: "test",
      },
      {
        Type: "Card",
        ID: "BRIK-OPP-0003",
        Lane: "Planned",
        Priority: "P2",
        Owner: "Pete",
        Business: "BRIK",
        Created: "2026-01-28",
        content: "Test",
        filePath: "test",
      },
      {
        Type: "Card",
        ID: "PLAT-OPP-0001",
        Lane: "Done",
        Priority: "P1",
        Owner: "Pete",
        Business: "PLAT",
        Created: "2026-01-28",
        content: "Test",
        filePath: "test",
      },
      {
        Type: "Card",
        ID: "PLAT-OPP-0002",
        Lane: "Inbox",
        Priority: "P3",
        Owner: "Pete",
        Business: "PLAT",
        Created: "2026-01-28",
        content: "Test",
        filePath: "test",
      },
    ];

    it("should filter only P0 and P1 cards for global board", () => {
      const result = filterCardsForBoard(testCards, "global");

      expect(result).toHaveLength(3);
      expect(result.every((card) => card.Priority === "P0" || card.Priority === "P1")).toBe(
        true
      );
      expect(result.map((c) => c.ID)).toEqual([
        "BRIK-OPP-0001",
        "BRIK-OPP-0002",
        "PLAT-OPP-0001",
      ]);
    });

    it("should filter cards by business code for business board", () => {
      const result = filterCardsForBoard(testCards, "business", "BRIK");

      expect(result).toHaveLength(3);
      expect(result.every((card) => card.Business === "BRIK")).toBe(true);
      expect(result.map((c) => c.ID)).toEqual([
        "BRIK-OPP-0001",
        "BRIK-OPP-0002",
        "BRIK-OPP-0003",
      ]);
    });

    it("should filter cards for different business", () => {
      const result = filterCardsForBoard(testCards, "business", "PLAT");

      expect(result).toHaveLength(2);
      expect(result.every((card) => card.Business === "PLAT")).toBe(true);
      expect(result.map((c) => c.ID)).toEqual(["PLAT-OPP-0001", "PLAT-OPP-0002"]);
    });

    it("should throw error if businessCode missing for business board", () => {
      expect(() => {
        filterCardsForBoard(testCards, "business");
      }).toThrow("businessCode is required for business board type");
    });

    it("should return empty array if no cards match", () => {
      const result = filterCardsForBoard(testCards, "business", "NONEXISTENT");

      expect(result).toHaveLength(0);
    });

    it("should return empty array for global board with no P0/P1 cards", () => {
      const lowPriorityCards: Card[] = [
        {
          Type: "Card",
          ID: "TEST-OPP-0001",
          Lane: "Inbox",
          Priority: "P3",
          Owner: "Pete",
          Business: "TEST",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = filterCardsForBoard(lowPriorityCards, "global");

      expect(result).toHaveLength(0);
    });
  });

  describe("orderCards", () => {
    it("should order by priority first (P0 > P1 > P2)", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "C",
          Lane: "Inbox",
          Priority: "P2",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "A",
          Lane: "Inbox",
          Priority: "P0",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "B",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = orderCards(cards);

      expect(result.map((c) => c.ID)).toEqual(["A", "B", "C"]);
      expect(result.map((c) => c.Priority)).toEqual(["P0", "P1", "P2"]);
    });

    it("should order by due date within same priority (earliest first)", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "C",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          "Due-Date": "2026-02-15",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "A",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          "Due-Date": "2026-01-30",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "B",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          "Due-Date": "2026-02-05",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = orderCards(cards);

      expect(result.map((c) => c.ID)).toEqual(["A", "B", "C"]);
      expect(result.map((c) => c["Due-Date"])).toEqual([
        "2026-01-30",
        "2026-02-05",
        "2026-02-15",
      ]);
    });

    it("should place cards with due dates before cards without", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "NO_DUE",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "HAS_DUE",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          "Due-Date": "2026-02-15",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = orderCards(cards);

      expect(result.map((c) => c.ID)).toEqual(["HAS_DUE", "NO_DUE"]);
    });

    it("should order by updated date within same priority (newest first)", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "OLD",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-25",
          Updated: "2026-01-26",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "NEW",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-25",
          Updated: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = orderCards(cards);

      expect(result.map((c) => c.ID)).toEqual(["NEW", "OLD"]);
    });

    it("should order by created date if no updated date (newest first)", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "OLD",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-25",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "NEW",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = orderCards(cards);

      expect(result.map((c) => c.ID)).toEqual(["NEW", "OLD"]);
    });

    it("should use ID as final tiebreaker (alphabetical)", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "Z-001",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "A-001",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = orderCards(cards);

      expect(result.map((c) => c.ID)).toEqual(["A-001", "Z-001"]);
    });

    it("should handle complex ordering with multiple factors", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "E",
          Lane: "Inbox",
          Priority: "P2",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "A",
          Lane: "Inbox",
          Priority: "P0",
          Owner: "Pete",
          "Due-Date": "2026-02-01",
          Created: "2026-01-25",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "C",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-27",
          Updated: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "B",
          Lane: "Inbox",
          Priority: "P0",
          Owner: "Pete",
          "Due-Date": "2026-02-15",
          Created: "2026-01-26",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "D",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-26",
          Updated: "2026-01-27",
          content: "Test",
          filePath: "test",
        },
      ];

      const result = orderCards(cards);

      // Expected order:
      // A: P0, Due 2026-02-01
      // B: P0, Due 2026-02-15
      // C: P1, Updated 2026-01-28
      // D: P1, Updated 2026-01-27
      // E: P2
      expect(result.map((c) => c.ID)).toEqual(["A", "B", "C", "D", "E"]);
    });

    it("should not mutate input array", () => {
      const cards: Card[] = [
        {
          Type: "Card",
          ID: "B",
          Lane: "Inbox",
          Priority: "P1",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
        {
          Type: "Card",
          ID: "A",
          Lane: "Inbox",
          Priority: "P0",
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        },
      ];

      const originalOrder = cards.map((c) => c.ID);
      orderCards(cards);

      expect(cards.map((c) => c.ID)).toEqual(originalOrder);
    });
  });

  describe("isGlobalBoardCard", () => {
    it("should return true for P0 cards", () => {
      const card: Card = {
        Type: "Card",
        ID: "TEST-001",
        Lane: "Inbox",
        Priority: "P0",
        Owner: "Pete",
        Created: "2026-01-28",
        content: "Test",
        filePath: "test",
      };

      expect(isGlobalBoardCard(card)).toBe(true);
    });

    it("should return true for P1 cards", () => {
      const card: Card = {
        Type: "Card",
        ID: "TEST-001",
        Lane: "Inbox",
        Priority: "P1",
        Owner: "Pete",
        Created: "2026-01-28",
        content: "Test",
        filePath: "test",
      };

      expect(isGlobalBoardCard(card)).toBe(true);
    });

    it("should return false for P2 and lower priority cards", () => {
      const priorities = ["P2", "P3", "P4", "P5"] as const;

      priorities.forEach((priority) => {
        const card: Card = {
          Type: "Card",
          ID: "TEST-001",
          Lane: "Inbox",
          Priority: priority,
          Owner: "Pete",
          Created: "2026-01-28",
          content: "Test",
          filePath: "test",
        };

        expect(isGlobalBoardCard(card)).toBe(false);
      });
    });
  });

  describe("getBoardTitle", () => {
    const labels = {
      global: "Global Board (P0/P1)",
      businessFallback: "Business Board",
    };

    it("should return global board title", () => {
      expect(getBoardTitle("global", labels)).toBe("Global Board (P0/P1)");
    });

    it("should return business name for business board", () => {
      expect(getBoardTitle("business", labels, "Hostel Brikette")).toBe(
        "Hostel Brikette"
      );
    });

    it("should return fallback for business board without name", () => {
      expect(getBoardTitle("business", labels)).toBe("Business Board");
    });
  });
});
