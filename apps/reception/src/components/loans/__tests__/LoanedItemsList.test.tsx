import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoanedItemsList } from "../LoanedItemsList";

/* eslint-disable no-var */
var useOccupantLoansMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../useOccupantLoans", () => {
  useOccupantLoansMock = jest.fn();
  return { __esModule: true, default: useOccupantLoansMock };
});

const guest = {
  guestId: "g1",
  bookingRef: "b1",
  firstName: "Alice",
  lastName: "Smith",
};

describe("LoanedItemsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOccupantLoansMock.mockReset();
  });

  it("handles loading, error and empty states", () => {
    useOccupantLoansMock.mockReturnValue({ loading: true });
    const { rerender } = render(
      <LoanedItemsList
        occupantId="g1"
        guest={guest}
        buttonDisabled={false}
        onReturnLoan={jest.fn()}
      />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    useOccupantLoansMock.mockReturnValue({ loading: false, error: "err" });
    rerender(
      <LoanedItemsList
        occupantId="g1"
        guest={guest}
        buttonDisabled={false}
        onReturnLoan={jest.fn()}
      />
    );
    expect(screen.getByText(/error loading occupant loans/i)).toBeInTheDocument();

    useOccupantLoansMock.mockReturnValue({
      loading: false,
      error: null,
      occupantLoans: { txns: {} },
    });
    rerender(
      <LoanedItemsList
        occupantId="g1"
        guest={guest}
        buttonDisabled={false}
        onReturnLoan={jest.fn()}
      />
    );
    expect(screen.getByText(/none/i)).toBeInTheDocument();
  });

  it("lists items and triggers return", async () => {
    useOccupantLoansMock.mockReturnValue({
      loading: false,
      error: null,
      occupantLoans: {
        txns: {
          T1: {
            item: "Umbrella",
            type: "Loan",
            count: 2,
            depositType: "CASH",
          },
          T2: {
            item: "Keycard",
            type: "Loan",
            count: 1,
            depositType: "ID",
          },
        },
      },
    });

    const onReturnLoan = jest.fn();
    const { rerender } = render(
      <LoanedItemsList
        occupantId="g1"
        guest={guest}
        buttonDisabled={false}
        onReturnLoan={onReturnLoan}
      />
    );

    expect(
      screen.getByText(/umbrella \(x2\) - cash/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/keycard \(x1\) - national id/i)
    ).toBeInTheDocument();

    const button = screen.getAllByRole("button", { name: /return/i })[0];
    await userEvent.click(button);
    expect(onReturnLoan).toHaveBeenCalledWith("b1", "g1", "Umbrella", 2);

    rerender(
      <LoanedItemsList
        occupantId="g1"
        guest={guest}
        buttonDisabled={true}
        onReturnLoan={onReturnLoan}
      />
    );
    expect(screen.getAllByRole("button", { name: /return/i })[0]).toBeDisabled();
  });
});

