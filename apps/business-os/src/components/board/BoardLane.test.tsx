/**
 * BoardLane Component Tests
 * BOS-UX-11
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import type { Card } from "@/lib/types";

import { BoardLane, getLaneHeaderColor, calculateLaneStats } from "./BoardLane";

const mockCards: Card[] = [
  {
    Type: "Card",
    ID: "TEST-001",
    Title: "High priority card",
    Lane: "In progress",
    Priority: "P0",
    Owner: "Pete",
    "Due-Date": "2026-01-20", // Overdue
    content: "Test",
    filePath: "/test",
  },
  {
    Type: "Card",
    ID: "TEST-002",
    Title: "Normal card",
    Lane: "In progress",
    Priority: "P2",
    Owner: "Alice",
    "Due-Date": "2026-03-01", // Future
    content: "Test",
    filePath: "/test",
  },
  {
    Type: "Card",
    ID: "TEST-003",
    Title: "Another high priority",
    Lane: "In progress",
    Priority: "P1",
    Owner: "Bob",
    content: "Test",
    filePath: "/test",
  },
];

describe("BoardLane", () => {
  it("renders lane title", () => {
    render(
      <BoardLane
        lane="In progress"
        cards={mockCards}
        ideas={[]}
        showBusinessTag={false}
      />
    );

    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("displays total card count", () => {
    render(
      <BoardLane
        lane="In progress"
        cards={mockCards}
        ideas={[]}
        showBusinessTag={false}
      />
    );

    expect(screen.getByText("3 cards")).toBeInTheDocument();
  });

  it("displays P0/P1 count", () => {
    render(
      <BoardLane
        lane="In progress"
        cards={mockCards}
        ideas={[]}
        showBusinessTag={false}
      />
    );

    expect(screen.getByText(/2 high priority/i)).toBeInTheDocument();
  });

  it("displays overdue count", () => {
    render(
      <BoardLane
        lane="In progress"
        cards={mockCards}
        ideas={[]}
        showBusinessTag={false}
      />
    );

    expect(screen.getByText(/1 overdue/i)).toBeInTheDocument();
  });

  it("shows empty state when no cards", () => {
    render(
      <BoardLane
        lane="Inbox"
        cards={[]}
        ideas={[]}
        showBusinessTag={false}
      />
    );

    expect(screen.getByText(/no cards in inbox/i)).toBeInTheDocument();
  });
});

describe("getLaneHeaderColor", () => {
  it("returns blue for planning lanes", () => {
    expect(getLaneHeaderColor("Inbox")).toBe("bg-info-soft");
    expect(getLaneHeaderColor("Fact-finding")).toBe("bg-info-soft");
    expect(getLaneHeaderColor("Planned")).toBe("bg-info-soft");
  });

  it("returns green for active lane", () => {
    expect(getLaneHeaderColor("In progress")).toBe("bg-success-soft");
  });

  it("returns gray for complete lanes", () => {
    expect(getLaneHeaderColor("Done")).toBe("bg-muted");
    expect(getLaneHeaderColor("Reflected")).toBe("bg-muted");
  });

  it("returns yellow for blocked lane", () => {
    expect(getLaneHeaderColor("Blocked")).toBe("bg-warning-soft");
  });
});

describe("calculateLaneStats", () => {
  it("calculates total count correctly", () => {
    const stats = calculateLaneStats(mockCards);
    expect(stats.total).toBe(3);
  });

  it("calculates P0/P1 count correctly", () => {
    const stats = calculateLaneStats(mockCards);
    expect(stats.highPriority).toBe(2);
  });

  it("calculates overdue count correctly", () => {
    const stats = calculateLaneStats(mockCards);
    expect(stats.overdue).toBe(1);
  });

  it("handles empty cards array", () => {
    const stats = calculateLaneStats([]);
    expect(stats.total).toBe(0);
    expect(stats.highPriority).toBe(0);
    expect(stats.overdue).toBe(0);
  });
});
