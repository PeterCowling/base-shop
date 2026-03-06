import "@testing-library/jest-dom";

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import KeycardDepositButton from "../KeycardDepositButton";

const saveLoanMock = jest.fn();
const addActivityMock = jest.fn();
const addToAllTransactionsMock = jest.fn();
const assignGuestKeycardMock = jest.fn();
const showToastMock = jest.fn();

jest.mock("../../../../context/LoanDataContext", () => ({
  useLoanData: () => ({ saveLoan: saveLoanMock }),
}));

jest.mock("../../../../hooks/mutations/useActivitiesMutations", () => ({
  __esModule: true,
  default: () => ({ addActivity: addActivityMock }),
}));

jest.mock("../../../../hooks/mutations/useAllTransactionsMutations", () => ({
  __esModule: true,
  default: () => ({ addToAllTransactions: addToAllTransactionsMock }),
}));

jest.mock("../../../../hooks/mutations/useKeycardAssignmentsMutations", () => ({
  __esModule: true,
  useKeycardAssignmentsMutations: () => ({
    assignGuestKeycard: assignGuestKeycardMock,
  }),
}));

jest.mock("../../../loans/useOccupantLoans", () => ({
  __esModule: true,
  default: () => ({ occupantLoans: { txns: {} } }),
}));

jest.mock("../../../../utils/toastUtils", () => ({
  __esModule: true,
  showToast: (...args: [string, string]) => showToastMock(...args),
}));

describe("KeycardDepositButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    saveLoanMock.mockResolvedValue(undefined);
    addToAllTransactionsMock.mockResolvedValue(undefined);
    addActivityMock.mockResolvedValue({ success: true });
    assignGuestKeycardMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows error when activity write returns success:false", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    addActivityMock.mockResolvedValueOnce({
      success: false,
      error: "activity failed",
    });

    render(
      <KeycardDepositButton
        booking={{
          bookingRef: "BR1",
          occupantId: "occ1",
          checkInDate: "2026-03-05",
          rooms: [],
        }}
      />
    );

    await user.click(screen.getByTitle("Confirm keycard deposit"));
    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("Error issuing keycard.", "error");
    });
    expect(saveLoanMock).toHaveBeenCalled();
    expect(addToAllTransactionsMock).toHaveBeenCalled();
  });
});

