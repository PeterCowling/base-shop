/**
 * BoardViewSwitcher Component Tests
 * BOS-UX-06
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BoardViewSwitcher, getLanesForView } from "./BoardViewSwitcher";

describe("BoardViewSwitcher", () => {
  it("renders all view tabs", () => {
    const onViewChange = jest.fn();
    render(<BoardViewSwitcher currentView="all" onViewChange={onViewChange} />);

    expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /planning/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /active/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /complete/i })).toBeInTheDocument();
  });

  it("highlights current tab", () => {
    const onViewChange = jest.fn();
    render(
      <BoardViewSwitcher currentView="planning" onViewChange={onViewChange} />
    );

    const planningTab = screen.getByRole("tab", { name: /planning/i });
    expect(planningTab).toHaveAttribute("aria-selected", "true");

    const allTab = screen.getByRole("tab", { name: /all/i });
    expect(allTab).toHaveAttribute("aria-selected", "false");
  });

  it("calls onViewChange when tab clicked", async () => {
    const onViewChange = jest.fn();
    const user = userEvent.setup();

    render(<BoardViewSwitcher currentView="all" onViewChange={onViewChange} />);

    const planningTab = screen.getByRole("tab", { name: /planning/i });
    await user.click(planningTab);

    expect(onViewChange).toHaveBeenCalledWith("planning");
  });
});

describe("getLanesForView", () => {
  it("returns all lanes for 'all' view", () => {
    const lanes = getLanesForView("all");
    expect(lanes).toEqual([
      "Inbox",
      "Fact-finding",
      "Planned",
      "In progress",
      "Blocked",
      "Done",
      "Reflected",
    ]);
  });

  it("returns planning lanes for 'planning' view", () => {
    const lanes = getLanesForView("planning");
    expect(lanes).toEqual(["Inbox", "Fact-finding", "Planned"]);
  });

  it("returns active lanes for 'active' view", () => {
    const lanes = getLanesForView("active");
    expect(lanes).toEqual(["In progress"]);
  });

  it("returns complete lanes for 'complete' view", () => {
    const lanes = getLanesForView("complete");
    expect(lanes).toEqual(["Done", "Reflected"]);
  });
});
