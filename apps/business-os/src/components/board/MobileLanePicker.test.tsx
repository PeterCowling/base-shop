/**
 * MobileLanePicker Component Tests
 * BOS-P2-03 Phase 2
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Lane } from "@/lib/types";

import { MobileLanePicker } from "./MobileLanePicker";

const allLanes: Lane[] = [
  "Inbox",
  "Fact-finding",
  "Planned",
  "In progress",
  "Blocked",
  "Done",
  "Reflected",
];

const mockCardCounts: Record<Lane, number> = {
  Inbox: 5,
  "Fact-finding": 3,
  Planned: 2,
  "In progress": 7,
  Blocked: 1,
  Done: 12,
  Reflected: 4,
};

describe("MobileLanePicker", () => {
  it("renders all 7 lanes as tabs", () => {
    const onLaneChange = jest.fn();

    render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    allLanes.forEach((lane) => {
      // eslint-disable-next-line security/detect-non-literal-regexp -- safe test data from controlled fixture
      expect(screen.getByRole("tab", { name: new RegExp(lane, "i") })).toBeInTheDocument();
    });
  });

  it("highlights active lane with aria-selected", () => {
    const onLaneChange = jest.fn();

    render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    const activeTab = screen.getByRole("tab", { name: /in progress/i });
    expect(activeTab).toHaveAttribute("aria-selected", "true");

    const inactiveTab = screen.getByRole("tab", { name: /inbox/i });
    expect(inactiveTab).toHaveAttribute("aria-selected", "false");
  });

  it("calls onLaneChange when tab is clicked", async () => {
    const user = userEvent.setup();
    const onLaneChange = jest.fn();

    render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    const inboxTab = screen.getByRole("tab", { name: /inbox/i });
    await user.click(inboxTab);

    expect(onLaneChange).toHaveBeenCalledWith("Inbox");
  });

  it("displays card counts for each lane", () => {
    const onLaneChange = jest.fn();

    render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    // Check that card counts are displayed (implementation will determine exact format)
    expect(screen.getByText(/5/)).toBeInTheDocument(); // Inbox count
    expect(screen.getByText(/7/)).toBeInTheDocument(); // In progress count
  });

  it("has tablist role for accessibility", () => {
    const onLaneChange = jest.fn();

    render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    const onLaneChange = jest.fn();

    render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    const inboxTab = screen.getByRole("tab", { name: /inbox/i });
    inboxTab.focus();

    await user.keyboard("{Enter}");
    expect(onLaneChange).toHaveBeenCalledWith("Inbox");
  });

  it("renders with fixed bottom positioning (mobile only)", () => {
    const onLaneChange = jest.fn();

    const { container } = render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("md:hidden"); // Hidden on desktop
  });

  it("has minimum touch target size (44px)", () => {
    const onLaneChange = jest.fn();

    render(
      <MobileLanePicker
        lanes={allLanes}
        activeLane="In progress"
        onLaneChange={onLaneChange}
        cardCountByLane={mockCardCounts}
      />
    );

    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) => {
      // Implementation should ensure min-h-11 (44px) for touch targets
      const styles = window.getComputedStyle(tab);
      const minHeight = parseInt(styles.minHeight);
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });
  });
});
