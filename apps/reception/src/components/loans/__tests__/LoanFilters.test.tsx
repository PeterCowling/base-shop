import "@testing-library/jest-dom";

import { type ComponentProps,useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type DateSelType from "../DateSel";
import { LoanFilters } from "../LoanFilters";

// Mock loan-related hooks for determinism
jest.mock("../../../hooks/data/useLoans", () => ({
  __esModule: true,
  default: () => ({ loans: {}, loading: false, error: null }),
}));
jest.mock("../../../context/LoanDataContext", () => ({
  useLoanData: () => ({ loans: {}, loading: false, error: null }),
}));

/* eslint-disable no-var */
var capturedProps: ComponentProps<typeof DateSelType> | null;

jest.mock("../DateSel", () => {
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
    jest.clearAllMocks();
  });

  it("calls filter callbacks", async () => {
    const onDateChange = jest.fn();
    const onGuestFilterChange = jest.fn();

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

