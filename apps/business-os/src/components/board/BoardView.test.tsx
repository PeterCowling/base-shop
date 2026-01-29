/**
 * BoardView Component Integration Tests
 * BOS-UX-10
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Business, Card, Idea, Lane } from "@/lib/types";

import { BoardView } from "./BoardView";

// Mock i18n
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockBusinesses: Business[] = [
  {
    id: "BRIK",
    name: "Brikette",
    description: "Retail ops",
    owner: "Pete",
    status: "active",
    created: "2025-01-01",
    tags: [],
  },
];

const mockCards: Card[] = [
  {
    Type: "Card",
    ID: "BRIK-001",
    Business: "BRIK",
    Lane: "Inbox",
    Priority: "P1",
    Owner: "Pete",
    "Due-Date": "2025-02-01",
    content: "# Test Card 1",
    Tags: [],
    filePath: "/test/cards/BRIK-001.user.md",
  },
  {
    Type: "Card",
    ID: "BRIK-002",
    Business: "BRIK",
    Lane: "Fact-finding",
    Priority: "P2",
    Owner: "Avery",
    "Due-Date": "2025-02-15",
    content: "# Test Card 2",
    Tags: [],
    filePath: "/test/cards/BRIK-002.user.md",
  },
];

const mockIdeas: Idea[] = [
  {
    Type: "Idea",
    ID: "BRIK-OPP-001",
    Business: "BRIK",
    Status: "raw",
    "Created-Date": "2025-01-20",
    content: "# Test Idea",
    Tags: [],
    filePath: "/test/ideas/inbox/BRIK-OPP-001.md",
  },
];

const mockLanes: Lane[] = [
  "Inbox",
  "Fact-finding",
  "Planned",
  "In progress",
  "Done",
  "Blocked",
];

const mockCardsByLane: Record<Lane, Card[]> = {
  Inbox: [mockCards[0]],
  "Fact-finding": [mockCards[1]],
  Planned: [],
  "In progress": [],
  Done: [],
  Blocked: [],
  Reflected: [],
};

describe("BoardView", () => {
  it("renders board with lanes", () => {
    render(
      <BoardView
        businessCode="BRIK"
        businesses={mockBusinesses}
          cardsByLane={mockCardsByLane}
        inboxIdeas={mockIdeas}
      />
    );

    // Should show all lanes
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Fact-finding")).toBeInTheDocument();
  });

  it("renders search bar", () => {
    render(
      <BoardView
        businessCode="BRIK"
        businesses={mockBusinesses}
          cardsByLane={mockCardsByLane}
        inboxIdeas={mockIdeas}
      />
    );

    expect(screen.getByPlaceholderText(/search cards/i)).toBeInTheDocument();
  });

  it("renders filter chips", () => {
    render(
      <BoardView
        businessCode="BRIK"
        businesses={mockBusinesses}
          cardsByLane={mockCardsByLane}
        inboxIdeas={mockIdeas}
      />
    );

    // Check for filter chip buttons
    expect(screen.getByRole("button", { name: /my items/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^overdue$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /p0\/p1/i })).toBeInTheDocument();
  });

  it("renders view switcher", () => {
    render(
      <BoardView
        businessCode="BRIK"
        businesses={mockBusinesses}
          cardsByLane={mockCardsByLane}
        inboxIdeas={mockIdeas}
      />
    );

    expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /planning/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /active/i })).toBeInTheDocument();
  });

  it("filters cards by search term", async () => {
    const user = userEvent.setup();
    render(
      <BoardView
        businessCode="BRIK"
        businesses={mockBusinesses}
          cardsByLane={mockCardsByLane}
        inboxIdeas={mockIdeas}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search cards/i);
    await user.type(searchInput, "BRIK-001");

    // Should show BRIK-001 card
    expect(screen.getByText(/BRIK-001/)).toBeInTheDocument();
  });

  it("switches between views", async () => {
    const user = userEvent.setup();
    render(
      <BoardView
        businessCode="BRIK"
        businesses={mockBusinesses}
          cardsByLane={mockCardsByLane}
        inboxIdeas={mockIdeas}
      />
    );

    // Switch to Planning view
    const planningTab = screen.getByRole("tab", { name: /planning/i });
    await user.click(planningTab);

    // Should only show planning lanes (Inbox, Fact-finding, Planned)
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Fact-finding")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
  });

  it("applies filter chips", async () => {
    const user = userEvent.setup();
    render(
      <BoardView
        businessCode="BRIK"
        businesses={mockBusinesses}
          cardsByLane={mockCardsByLane}
        inboxIdeas={mockIdeas}
      />
    );

    // Click P0/P1 filter
    const p0p1Filter = screen.getByText(/p0\/p1/i);
    await user.click(p0p1Filter);

    // Should show only P1 card (BRIK-001)
    expect(screen.getByText(/BRIK-001/)).toBeInTheDocument();
  });
});
