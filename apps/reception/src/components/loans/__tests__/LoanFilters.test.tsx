import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState, type ComponentProps } from "react";
import type DateSelType from "../DateSel";

// Mock loan-related hooks for determinism
vi.mock("../../../hooks/data/useLoans", () => ({
  __esModule: true,
  default: () => ({ loans: {}, loading: false, error: null }),
}));
vi.mock("../../../context/LoanDataContext", () => ({
  useLoanData: () => ({ loans: {}, loading: false, error: null }),
}));

/* eslint-disable no-var */
var capturedProps: ComponentProps<typeof DateSelType> | null;
/* eslint-enable no-var */

import { LoanFilters } from "../LoanFilters";

vi.mock("../DateSel", () => {
  return {
    __esModule: true,
    default: (props: ComponentProps<typeof DateSelType>) => {
      capturedProps = props;
      return <div data-testid="datesel" />;
    },
  };
});

describe("LoanFilters", () => {
  beforeEach(() => {
    capturedProps = null;
    vi.clearAllMocks();
  });

  it("calls filter callbacks", async () => {
    const onDateChange = vi.fn();
    const onGuestFilterChange = vi.fn();

    function Wrapper() {
      const [guestFilter, setGuestFilter] = useState("");
      return (
        <LoanFilters
          username="john"
          selectedDate="2024-05-01"
          onDateChange={onDateChange}
          guestFilter={guestFilter}
          onGuestFilterChange={(val) => {
            setGuestFilter(val);
            onGuestFilterChange(val);
          }}
        />
      );
    }

    render(<Wrapper />);

    // simulate date change
    capturedProps?.onDateChange("2024-05-02");
    expect(onDateChange).toHaveBeenCalledWith("2024-05-02");

    const input = screen.getByPlaceholderText(/type a name/i);
    await userEvent.type(input, "Alice");
    expect(onGuestFilterChange).toHaveBeenLastCalledWith("Alice");
  });
});

