import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { ActionRail } from "../ActionRail";
import { FilterToolbar } from "../FilterToolbar";
import { ScreenHeader } from "../ScreenHeader";
import { TableCard } from "../TableCard";

describe("ScreenHeader", () => {
  it("renders the title", () => {
    render(<ScreenHeader title="Check-ins" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Check-ins"
    );
  });

  it("renders accent bar with aria-hidden", () => {
    const { container } = render(<ScreenHeader title="Check-ins" />);
    const bar = container.querySelector('[aria-hidden="true"]');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass("bg-primary-main");
  });

  it("renders optional right-side children slot", () => {
    render(
      <ScreenHeader title="Check-ins">
        <button>New Booking</button>
      </ScreenHeader>
    );
    expect(screen.getByRole("button", { name: "New Booking" })).toBeInTheDocument();
  });

  it("renders without children without crashing", () => {
    const { container } = render(<ScreenHeader title="Check-ins" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("ActionRail", () => {
  it("renders injected children", () => {
    render(
      <ActionRail>
        <button>Edit</button>
        <button>Delete</button>
      </ActionRail>
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("applies justify-end layout class", () => {
    const { container } = render(
      <ActionRail>
        <button>Action</button>
      </ActionRail>
    );
    expect(container.firstChild).toHaveClass("justify-end");
  });
});

describe("FilterToolbar", () => {
  it("renders injected children", () => {
    render(
      <FilterToolbar>
        <span data-testid="date-selector">Date</span>
        <span data-testid="rooms-ready">Rooms Ready</span>
      </FilterToolbar>
    );
    expect(screen.getByTestId("date-selector")).toBeInTheDocument();
    expect(screen.getByTestId("rooms-ready")).toBeInTheDocument();
  });

  it("returns null when children is null/undefined", () => {
    const { container } = render(<FilterToolbar>{null}</FilterToolbar>);
    expect(container.firstChild).toBeNull();
  });

  it("applies flex-wrap layout class", () => {
    const { container } = render(
      <FilterToolbar>
        <span>Filter</span>
      </FilterToolbar>
    );
    expect(container.firstChild).toHaveClass("flex-wrap");
  });
});

describe("TableCard", () => {
  it("renders children inside the card surface", () => {
    render(
      <TableCard>
        <table>
          <tbody>
            <tr>
              <td>Row 1</td>
            </tr>
          </tbody>
        </table>
      </TableCard>
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("applies canonical surface/border/shadow classes", () => {
    const { container } = render(
      <TableCard>
        <span>content</span>
      </TableCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-surface-2");
    expect(card).toHaveClass("rounded-xl");
    expect(card).toHaveClass("border-border-strong");
    expect(card).toHaveClass("shadow-xl");
  });

  it("applies overflow-x-auto for horizontal table scrolling", () => {
    const { container } = render(
      <TableCard>
        <span>content</span>
      </TableCard>
    );
    expect(container.firstChild).toHaveClass("overflow-x-auto");
  });
});
