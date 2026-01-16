import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* eslint-disable no-var */
var useOccupantLoansMock: ReturnType<typeof vi.fn>;
var loanDataMock: {
  updateLoanDepositType: ReturnType<typeof vi.fn>;
  convertKeycardDocToCash: ReturnType<typeof vi.fn>;
};
/* eslint-enable no-var */

vi.mock("../useOccupantLoans", () => {
  useOccupantLoansMock = vi.fn();
  return { __esModule: true, default: useOccupantLoansMock };
});

vi.mock("../../../context/LoanDataContext", () => ({
  __esModule: true,
  useLoanData: () => loanDataMock,
}));

import { KeycardsModal } from "../KeycardsModal";

const occupant = {
  guestId: "g1",
  bookingRef: "b1",
  firstName: "Alice",
  lastName: "Smith",
};

describe("KeycardsModal", () => {
  beforeEach(() => {
    loanDataMock = {
      updateLoanDepositType: vi.fn(),
      convertKeycardDocToCash: vi.fn(),
    };
    vi.clearAllMocks();
    useOccupantLoansMock.mockReset();
  });

  it("renders loading, error and empty states", () => {
    useOccupantLoansMock.mockReturnValue({ loading: true });
    const { rerender } = render(
      <KeycardsModal isOpen occupant={occupant} onClose={vi.fn()} />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    useOccupantLoansMock.mockReturnValue({ loading: false, error: "boom" });
    rerender(<KeycardsModal isOpen occupant={occupant} onClose={vi.fn()} />);
    expect(screen.getByText(/error loading keycards/i)).toBeInTheDocument();

    useOccupantLoansMock.mockReturnValue({
      loading: false,
      error: null,
      occupantLoans: { txns: {} },
    });
    rerender(<KeycardsModal isOpen occupant={occupant} onClose={vi.fn()} />);
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

    render(<KeycardsModal isOpen occupant={occupant} onClose={vi.fn()} />);

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
    await vi.waitFor(() =>
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
    const onClose = vi.fn();
    render(<KeycardsModal isOpen occupant={occupant} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});

