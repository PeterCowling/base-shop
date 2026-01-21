import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../useOccupantLoans", () => ({
  __esModule: true,
  default: () => ({ occupantLoans: { txns: {} }, loading: false, error: null }),
}));

jest.mock("../KeycardsModal", () => ({
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
      <LoansTable loading buttonDisabled onAddLoan={jest.fn()} onReturnLoan={jest.fn()} />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    rerender(
      <LoansTable error="err" buttonDisabled onAddLoan={jest.fn()} onReturnLoan={jest.fn()} />
    );
    expect(screen.getByText(/error: err/i)).toBeInTheDocument();

    rerender(
      <LoansTable guests={[]} buttonDisabled onAddLoan={jest.fn()} onReturnLoan={jest.fn()} />
    );
    expect(screen.getByText(/no guests available/i)).toBeInTheDocument();
  });

  it("adds a loan via modal", async () => {
    const onAddLoan = jest.fn();
    render(
      <LoansTable
        guests={[guest]}
        buttonDisabled={false}
        onAddLoan={onAddLoan}
        onReturnLoan={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /loan/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onAddLoan).toHaveBeenCalledWith("b1", "g1", "Keycard", 1, "CASH");
  });
});

