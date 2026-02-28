// apps/brikette/src/test/components/date-range-picker.test.tsx
// Unit tests for the DateRangePicker component (TASK-08 validation contracts).
//
// TC-01: No range passed → stayHelperText is visible
// TC-02: Partial range (from only) → summary absent; stayHelperText shown
// TC-03: Complete range → summary "DD MMM → DD MMM (N nights)" visible
// TC-04: Clear button click → calls onRangeChange(undefined)

import "@testing-library/jest-dom";

import React from "react";
import type { DateRange } from "react-day-picker";
import { fireEvent, render, screen } from "@testing-library/react";

import { DateRangePicker } from "@/components/booking/DateRangePicker";

// Mock DayPicker — exposes a button that calls onSelect to simulate range selection
jest.mock("react-day-picker", () => ({
  __esModule: true,
  DayPicker: ({
    onSelect,
  }: {
    onSelect: (range: DateRange | undefined) => void;
    selected?: DateRange;
  }) => (
    <div data-cy="mock-daypicker">
      <button
        type="button"
        data-cy="mock-select-complete-range"
        onClick={() =>
          onSelect({ from: new Date(2026, 2, 15), to: new Date(2026, 2, 17) })
        }
      >
        Select complete range
      </button>
      <button
        type="button"
        data-cy="mock-select-partial-range"
        onClick={() =>
          onSelect({ from: new Date(2026, 2, 15), to: undefined })
        }
      >
        Select partial range
      </button>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DateRangePicker", () => {
  // TC-01: No range → stayHelperText visible
  it("TC-01: renders with no initial range — shows stayHelperText", () => {
    const handleChange = jest.fn();
    render(
      <DateRangePicker
        selected={undefined}
        onRangeChange={handleChange}
        stayHelperText="2–8 nights"
        clearDatesText="Clear dates"
      />
    );

    expect(screen.getByText("2–8 nights")).toBeInTheDocument();
    expect(screen.queryByText(/→/)).toBeNull();
  });

  // TC-02: Partial range (from only) → no summary; stayHelperText shown
  it("TC-02: partial range (from only) — shows helper, no summary", () => {
    const handleChange = jest.fn();
    render(
      <DateRangePicker
        selected={{ from: new Date(2026, 2, 15), to: undefined }}
        onRangeChange={handleChange}
        stayHelperText="2–8 nights"
        clearDatesText="Clear dates"
      />
    );

    expect(screen.getByText("2–8 nights")).toBeInTheDocument();
    expect(screen.queryByText(/nights\)/)).toBeNull();
  });

  // TC-03: Complete range → summary "DD MMM → DD MMM (N nights)" visible
  it("TC-03: complete range — shows derived summary with nights count", () => {
    const handleChange = jest.fn();
    render(
      <DateRangePicker
        selected={{ from: new Date(2026, 2, 15), to: new Date(2026, 2, 17) }}
        onRangeChange={handleChange}
        stayHelperText="2–8 nights"
        clearDatesText="Clear dates"
      />
    );

    // Summary: "15 Mar → 17 Mar (2 nights)"
    expect(screen.getByText(/15 Mar.*17 Mar.*2 nights/)).toBeInTheDocument();
    expect(screen.queryByText("2–8 nights")).toBeNull();
  });

  // TC-04: Clear button → calls onRangeChange(undefined)
  it("TC-04: clicking clear button calls onRangeChange with undefined", () => {
    const handleChange = jest.fn();
    render(
      <DateRangePicker
        selected={{ from: new Date(2026, 2, 15), to: new Date(2026, 2, 17) }}
        onRangeChange={handleChange}
        stayHelperText="2–8 nights"
        clearDatesText="Clear dates"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear dates" }));
    expect(handleChange).toHaveBeenCalledWith(undefined);
  });
});
