/**
 * FilterChips Component Tests
 * BOS-UX-09
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Card } from "@/lib/types";

import { applyFilters, FilterChips, type FilterType } from "./FilterChips";

describe("FilterChips", () => {
  it("renders all filter chips", () => {
    const onFiltersChange = jest.fn();

    render(
      <FilterChips activeFilters={[]} onFiltersChange={onFiltersChange} />
    );

    expect(screen.getByRole("button", { name: /my items/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /overdue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /p0\/p1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /blocked/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /untriaged/i })).toBeInTheDocument();
  });

  it("toggles chip active state when clicked", async () => {
    const onFiltersChange = jest.fn();
    const user = userEvent.setup();

    render(
      <FilterChips activeFilters={[]} onFiltersChange={onFiltersChange} />
    );

    const myItemsChip = screen.getByRole("button", { name: /my items/i });
    await user.click(myItemsChip);

    expect(onFiltersChange).toHaveBeenCalledWith(["myItems"]);
  });

  it("allows multiple chips to be active", async () => {
    const onFiltersChange = jest.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <FilterChips activeFilters={[]} onFiltersChange={onFiltersChange} />
    );

    // Click first chip
    await user.click(screen.getByRole("button", { name: /my items/i }));
    expect(onFiltersChange).toHaveBeenCalledWith(["myItems"]);

    // Rerender with first chip active
    rerender(
      <FilterChips activeFilters={["myItems"]} onFiltersChange={onFiltersChange} />
    );

    // Click second chip
    await user.click(screen.getByRole("button", { name: /overdue/i }));
    expect(onFiltersChange).toHaveBeenCalledWith(["myItems", "overdue"]);
  });

  it("deactivates chip when clicked again", async () => {
    const onFiltersChange = jest.fn();
    const user = userEvent.setup();

    render(
      <FilterChips activeFilters={["myItems"]} onFiltersChange={onFiltersChange} />
    );

    const myItemsChip = screen.getByRole("button", { name: /my items/i });
    await user.click(myItemsChip);

    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });

  it("shows clear all button when filters are active", () => {
    const onFiltersChange = jest.fn();

    render(
      <FilterChips activeFilters={["myItems", "overdue"]} onFiltersChange={onFiltersChange} />
    );

    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  it("hides clear all button when no filters active", () => {
    const onFiltersChange = jest.fn();

    render(
      <FilterChips activeFilters={[]} onFiltersChange={onFiltersChange} />
    );

    expect(screen.queryByRole("button", { name: /clear all/i })).not.toBeInTheDocument();
  });

  it("clears all filters when clear all clicked", async () => {
    const onFiltersChange = jest.fn();
    const user = userEvent.setup();

    render(
      <FilterChips activeFilters={["myItems", "overdue"]} onFiltersChange={onFiltersChange} />
    );

    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });
});

describe("applyFilters", () => {
  const mockCards: Card[] = [
    {
      Type: "Card",
      ID: "TEST-001",
      Title: "My overdue P0 card",
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
      Title: "Someone else's card",
      Lane: "Planned",
      Priority: "P2",
      Owner: "Alice",
      content: "Test",
      filePath: "/test",
    },
    {
      Type: "Card",
      ID: "TEST-003",
      Title: "Blocked card",
      Lane: "In progress",
      Priority: "P1",
      Owner: "Bob",
      Blocked: true,
      content: "Test",
      filePath: "/test",
    },
    {
      Type: "Card",
      ID: "TEST-004",
      Title: "Untriaged card",
      Lane: "Inbox",
      Priority: "P3",
      Owner: "Charlie",
      content: "Test",
      filePath: "/test",
    },
  ];

  it("filters by myItems", () => {
    const filtered = applyFilters(mockCards, ["myItems"], "Pete");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ID).toBe("TEST-001");
  });

  it("filters by overdue", () => {
    const filtered = applyFilters(mockCards, ["overdue"], "Pete");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ID).toBe("TEST-001");
  });

  it("filters by P0/P1", () => {
    const filtered = applyFilters(mockCards, ["highPriority"], "Pete");
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.ID)).toEqual(["TEST-001", "TEST-003"]);
  });

  it("filters by blocked", () => {
    const filtered = applyFilters(mockCards, ["blocked"], "Pete");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ID).toBe("TEST-003");
  });

  it("filters by untriaged", () => {
    const filtered = applyFilters(mockCards, ["untriaged"], "Pete");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ID).toBe("TEST-004");
  });

  it("applies multiple filters with AND logic", () => {
    const filtered = applyFilters(mockCards, ["myItems", "overdue"], "Pete");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ID).toBe("TEST-001");
  });

  it("returns all cards when no filters active", () => {
    const filtered = applyFilters(mockCards, [], "Pete");
    expect(filtered).toHaveLength(4);
  });
});
