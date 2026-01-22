import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KeycardsModal } from "../KeycardsModal";

/* eslint-disable no-var */
var useOccupantLoansMock: jest.Mock;
var loanDataMock: {
  updateLoanDepositType: jest.Mock;
  convertKeycardDocToCash: jest.Mock;
};
/* eslint-enable no-var */

jest.mock("../useOccupantLoans", () => {
  useOccupantLoansMock = jest.fn();
  return { __esModule: true, default: useOccupantLoansMock };
});

jest.mock("../../../context/LoanDataContext", () => ({
  __esModule: true,
  useLoanData: () => loanDataMock,
}));

const occupant = {
  guestId: "g1",
  bookingRef: "b1",
  firstName: "Alice",
  lastName: "Smith",
};

describe("KeycardsModal", () => {
  beforeEach(() => {
    loanDataMock = {
      updateLoanDepositType: jest.fn(),
      convertKeycardDocToCash: jest.fn(),
    };
    jest.clearAllMocks();
    useOccupantLoansMock.mockReset();
  });

  it("renders loading, error and empty states", () => {
    useOccupantLoansMock.mockReturnValue({ loading: true });
    const { rerender } = render(
      <KeycardsModal isOpen occupant={occupant} onClose={jest.fn()} />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    useOccupantLoansMock.mockReturnValue({ loading: false, error: "boom" });
    rerender(<KeycardsModal isOpen occupant={occupant} onClose={jest.fn()} />);
    expect(screen.getByText(/error loading keycards/i)).toBeInTheDocument();

    useOccupantLoansMock.mockReturnValue({
      loading: false,
      error: null,
      occupantLoans: { txns: {} },
    });
    rerender(<KeycardsModal isOpen occupant={occupant} onClose={jest.fn()} />);
    expect(screen.getByText(/no keycards currently loaned/i)).toBeInTheDocument();
  });

  it("updates deposit types and saves", async () => {
    useOccupantLoansMock.mockReturnValue({
      loading: false,
      error: null,
      occupantLoans: {
        txns: {
          T1: {
            item: "Keycard",
            type: "Loan",
            count: 1,
            depositType: "ID",
          },
        },
      },
    });

    loanDataMock.updateLoanDepositType.mockResolvedValue(undefined);
    loanDataMock.convertKeycardDocToCash.mockResolvedValue(undefined);

    render(<KeycardsModal isOpen occupant={occupant} onClose={jest.fn()} />);

    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "PASSPORT");
    let saveBtn = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);
    expect(loanDataMock.updateLoanDepositType).toHaveBeenCalledWith(
      "b1",
      "g1",
      "T1",
      "PASSPORT"
    );
    await /* vi.waitFor - use waitFor from @testing-library/react instead */ (() =>
      expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
    );

    await userEvent.selectOptions(select, "CASH");
    saveBtn = screen.getByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);
    expect(loanDataMock.convertKeycardDocToCash).toHaveBeenCalledWith(
      "b1",
      "g1",
      "T1",
      1
    );
  });

  it("closes via button", async () => {
    useOccupantLoansMock.mockReturnValue({ occupantLoans: { txns: {} } });
    const onClose = jest.fn();
    render(<KeycardsModal isOpen occupant={occupant} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});

