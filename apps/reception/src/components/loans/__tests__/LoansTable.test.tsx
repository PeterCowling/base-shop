import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../useOccupantLoans", () => ({
  __esModule: true,
  default: () => ({ occupantLoans: { txns: {} }, loading: false, error: null }),
}));

vi.mock("../KeycardsModal", () => ({
  __esModule: true,
  KeycardsModal: () => <div data-testid="keycards-modal" />,
  default: () => <div data-testid="keycards-modal" />,
}));

import { LoansTable } from "../LoansTable";

const guest = {
  occupantId: "g1",
  bookingRef: "b1",
  firstName: "Alice",
  lastName: "Smith",
};

describe("LoansTable", () => {
  it("handles table states", () => {
    const { rerender } = render(
      <LoansTable loading buttonDisabled onAddLoan={vi.fn()} onReturnLoan={vi.fn()} />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    rerender(
      <LoansTable error="err" buttonDisabled onAddLoan={vi.fn()} onReturnLoan={vi.fn()} />
    );
    expect(screen.getByText(/error: err/i)).toBeInTheDocument();

    rerender(
      <LoansTable guests={[]} buttonDisabled onAddLoan={vi.fn()} onReturnLoan={vi.fn()} />
    );
    expect(screen.getByText(/no guests available/i)).toBeInTheDocument();
  });

  it("adds a loan via modal", async () => {
    const onAddLoan = vi.fn();
    render(
      <LoansTable
        guests={[guest]}
        buttonDisabled={false}
        onAddLoan={onAddLoan}
        onReturnLoan={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /loan/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onAddLoan).toHaveBeenCalledWith("b1", "g1", "Keycard", 1, "CASH");
  });
});

