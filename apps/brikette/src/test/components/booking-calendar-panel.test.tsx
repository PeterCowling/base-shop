import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { BookingCalendarPanel } from "@/components/booking/BookingCalendarPanel";
import type { DateRange } from "@/components/booking/DateRangePicker";

jest.mock("@/components/booking/DateRangePicker", () => ({
  DateRangePicker: ({
    onRangeChange,
  }: {
    onRangeChange: (next: DateRange | undefined) => void;
  }) => (
    <div data-cy="mock-date-range-picker">
      <button
        type="button"
        data-testid="mock-range-change"
        onClick={() =>
          onRangeChange({
            from: new Date("2026-06-10T00:00:00.000Z"),
            to: new Date("2026-06-12T00:00:00.000Z"),
          })
        }
      >
        Change range
      </button>
    </div>
  ),
}));

jest.mock("@/utils/dateUtils", () => ({
  ...jest.requireActual("@/utils/dateUtils"),
  formatDisplayDate: (d: Date) => d.toISOString().slice(0, 10),
}));

function renderPanel(overrides: Partial<React.ComponentProps<typeof BookingCalendarPanel>> = {}) {
  const onRangeChange = jest.fn();
  const onPaxChange = jest.fn();

  const defaultProps: React.ComponentProps<typeof BookingCalendarPanel> = {
    range: {
      from: new Date("2026-06-10T00:00:00.000Z"),
      to: new Date("2026-06-12T00:00:00.000Z"),
    },
    onRangeChange,
    pax: 2,
    onPaxChange,
    minPax: 1,
    maxPax: 3,
    stayHelperText: "2-8 nights",
    clearDatesText: "Clear dates",
    checkInLabelText: "Check in",
    checkOutLabelText: "Check out",
    guestsLabelText: "Guests",
    decreaseGuestsAriaLabel: "Decrease guests",
    increaseGuestsAriaLabel: "Increase guests",
  };

  render(<BookingCalendarPanel {...defaultProps} {...overrides} />);

  return { onRangeChange, onPaxChange };
}

describe("BookingCalendarPanel", () => {
  it("disables decrement at min pax and increment at max pax", () => {
    renderPanel({ pax: 1, minPax: 1, maxPax: 1 });

    expect(screen.getByRole("button", { name: "Decrease guests" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase guests" })).toBeDisabled();
  });

  it("clamps pax updates to min/max values", () => {
    const { onPaxChange } = renderPanel({ pax: 2, minPax: 1, maxPax: 3 });

    fireEvent.click(screen.getByRole("button", { name: "Decrease guests" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase guests" }));

    expect(onPaxChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPaxChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("forwards range changes from DateRangePicker", () => {
    const { onRangeChange } = renderPanel();

    fireEvent.click(screen.getByTestId("mock-range-change"));

    expect(onRangeChange).toHaveBeenCalledWith({
      from: new Date("2026-06-10T00:00:00.000Z"),
      to: new Date("2026-06-12T00:00:00.000Z"),
    });
  });

  it("renders action slot content", () => {
    renderPanel({
      actionSlot: (
        <button type="button">
          Continue
        </button>
      ),
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("shows formatted check-in and check-out values", () => {
    renderPanel();

    expect(screen.getAllByText("2026-06-10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-06-12").length).toBeGreaterThan(0);
  });
});
