/**
 * CompactCard Component Tests
 * BOS-UX-07
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";

import type { Card } from "@/lib/types";

import { CompactCard } from "./CompactCard";

const mockCard: Card = {
  Type: "Card",
  ID: "TEST-001",
  Title: "Test Card",
  Lane: "In progress",
  Priority: "P1",
  Owner: "Pete Cowling",
  Business: "BRIK",
  content: "Test content",
  filePath: "/test/path",
};

describe("CompactCard", () => {
  it("renders card title", () => {
    render(<CompactCard card={mockCard} showBusinessTag={false} />);

    expect(screen.getByText("Test Card")).toBeInTheDocument();
  });

  it("displays due date when present", () => {
    const cardWithDueDate = {
      ...mockCard,
      "Due-Date": "2026-01-31",
    };

    render(<CompactCard card={cardWithDueDate} showBusinessTag={false} />);

    // Should show due date (formatted)
    expect(screen.getByText(/Jan 31/i)).toBeInTheDocument();
  });

  it("shows owner initials chip", () => {
    render(<CompactCard card={mockCard} showBusinessTag={false} />);

    // Should show initials PC for Pete Cowling
    expect(screen.getByText("PC")).toBeInTheDocument();
  });

  it("shows business tag when showBusinessTag is true", () => {
    render(<CompactCard card={mockCard} showBusinessTag={true} />);

    expect(screen.getByText("BRIK")).toBeInTheDocument();
  });

  it("hides business tag when showBusinessTag is false", () => {
    render(<CompactCard card={mockCard} showBusinessTag={false} />);

    expect(screen.queryByText("BRIK")).not.toBeInTheDocument();
  });

  it("shows overdue date in red color", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const overdueCard = {
      ...mockCard,
      "Due-Date": yesterday.toISOString().split("T")[0],
    };

    const { container } = render(
      <CompactCard card={overdueCard} showBusinessTag={false} />
    );

    // Check for red text color class
    const dueDateElement = container.querySelector(".text-danger");
    expect(dueDateElement).toBeInTheDocument();
  });

  it("shows due soon date in amber color", () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const dueSoonCard = {
      ...mockCard,
      "Due-Date": threeDaysFromNow.toISOString().split("T")[0],
    };

    const { container } = render(
      <CompactCard card={dueSoonCard} showBusinessTag={false} />
    );

    // Check for warning/amber color class
    const dueDateElement = container.querySelector(".text-warning");
    expect(dueDateElement).toBeInTheDocument();
  });

  it("handles card without due date gracefully", () => {
    const cardNoDueDate = {
      ...mockCard,
      "Due-Date": undefined,
    };

    render(<CompactCard card={cardNoDueDate} showBusinessTag={false} />);

    // Should still render the card
    expect(screen.getByText("Test Card")).toBeInTheDocument();
  });

  it("shows BLOCKED badge when card is blocked", () => {
    const blockedCard = {
      ...mockCard,
      Blocked: true,
    };

    render(<CompactCard card={blockedCard} showBusinessTag={false} />);

    expect(screen.getByText("BLOCKED")).toBeInTheDocument();
  });

  it("hides BLOCKED badge when card is not blocked", () => {
    const notBlockedCard = {
      ...mockCard,
      Blocked: false,
    };

    render(<CompactCard card={notBlockedCard} showBusinessTag={false} />);

    expect(screen.queryByText("BLOCKED")).not.toBeInTheDocument();
  });

  it("applies blocked visual styling when card is blocked", () => {
    const blockedCard = {
      ...mockCard,
      Blocked: true,
    };

    const { container } = render(
      <CompactCard card={blockedCard} showBusinessTag={false} />
    );

    const link = container.querySelector("a");
    expect(link).toHaveClass("border-l-4");
    expect(link).toHaveClass("border-l-danger");
    expect(link).toHaveClass("bg-danger-soft");
  });

  it("shows blocked reason in title attribute", () => {
    const blockedCard = {
      ...mockCard,
      Blocked: true,
      "Blocked-Reason": "Waiting for API approval",
    };

    const { container } = render(
      <CompactCard card={blockedCard} showBusinessTag={false} />
    );

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("title", "Blocked: Waiting for API approval");
  });
});
