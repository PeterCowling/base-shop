import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Checkout from "../../components/checkout/Checkout";

/* eslint-disable no-var */
var checkoutClientMock: jest.Mock;
var bookingsMock: jest.Mock;
var guestDetailsMock: jest.Mock;
var financialsRoomMock: jest.Mock;
var loansMock: jest.Mock;
var activitiesDataMock: jest.Mock;
var activitiesByCodeDataMock: jest.Mock;
var checkoutsMock: jest.Mock;
var guestByRoomMock: jest.Mock;
var bagStorageDataMock: jest.Mock;
var removeLoanItemMock: jest.Mock;
var saveActivityMock: jest.Mock;
var removeLastActivityMock: jest.Mock;
var addToAllTransactionsMock: jest.Mock;
var saveCheckoutMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

jest.mock("../../context/LoanDataContext", () => {
  removeLoanItemMock = jest.fn().mockResolvedValue(undefined);
  return { useLoanData: () => ({ removeLoanItem: removeLoanItemMock }) };
});

jest.mock("../../hooks/client/useCheckoutClient", () => {
  checkoutClientMock = jest.fn();
  return {
    __esModule: true,
    default: (...args: unknown[]) => checkoutClientMock(...args),
  };
});

jest.mock("../../hooks/data/useBookingsData", () => {
  bookingsMock = jest.fn();
  return { __esModule: true, default: () => bookingsMock() };
});

jest.mock("../../hooks/data/useGuestDetails", () => {
  guestDetailsMock = jest.fn();
  return { __esModule: true, default: () => guestDetailsMock() };
});

jest.mock("../../hooks/data/useFinancialsRoom", () => {
  financialsRoomMock = jest.fn();
  return { __esModule: true, default: () => financialsRoomMock() };
});

jest.mock("../../hooks/data/useLoans", () => {
  loansMock = jest.fn();
  return { __esModule: true, default: () => loansMock() };
});

jest.mock("../../hooks/data/useActivitiesData", () => {
  activitiesDataMock = jest.fn();
  return { __esModule: true, default: () => activitiesDataMock() };
});

jest.mock("../../hooks/data/useActivitiesByCodeData", () => {
  activitiesByCodeDataMock = jest.fn();
  return { __esModule: true, default: () => activitiesByCodeDataMock() };
});

jest.mock("../../hooks/data/useCheckouts", () => {
  checkoutsMock = jest.fn();
  return { useCheckouts: () => checkoutsMock() };
});

jest.mock("../../hooks/data/useGuestByRoom", () => {
  guestByRoomMock = jest.fn();
  return { __esModule: true, default: () => guestByRoomMock() };
});

jest.mock("../../hooks/data/useBagStorageData", () => {
  bagStorageDataMock = jest.fn();
  return { __esModule: true, default: () => bagStorageDataMock() };
});

jest.mock("../../hooks/mutations/useActivitiesMutations", () => {
  saveActivityMock = jest.fn().mockResolvedValue({ success: true });
  removeLastActivityMock = jest.fn().mockResolvedValue({ success: true });
  return {
    __esModule: true,
    default: () => ({
      saveActivity: saveActivityMock,
      removeLastActivity: removeLastActivityMock,
    }),
  };
});

jest.mock("../../hooks/mutations/useCheckoutsMutation", () => {
  saveCheckoutMock = jest.fn().mockResolvedValue(undefined);
  return { useCheckoutsMutation: () => ({ saveCheckout: saveCheckoutMock }) };
});

jest.mock("../../hooks/mutations/useAllTransactionsMutations", () => {
  addToAllTransactionsMock = jest.fn();
  return {
    __esModule: true,
    default: () => ({ addToAllTransactions: addToAllTransactionsMock }),
  };
});

jest.mock("../../hooks/data/useKeycardAssignments", () => ({
  useKeycardAssignments: () => ({
    assignments: [],
    assignmentsRecord: {},
    activeAssignments: [],
    loading: false,
    error: null,
  }),
}));

jest.mock("../../hooks/mutations/useKeycardAssignmentsMutations", () => ({
  useKeycardAssignmentsMutations: () => ({
    assignGuestKeycard: jest.fn(),
    assignMasterKey: jest.fn(),
    returnKeycard: jest.fn(),
    markLost: jest.fn(),
  }),
}));

const financials = {
  balance: 0,
  totalDue: 0,
  totalPaid: 0,
  totalAdjust: 0,
  transactions: {},
};

const sampleRows = [
  {
    bookingRef: "BR1",
    occupantId: "G1",
    checkOutDate: "2025-01-01",
    checkOutTimestamp: null,
    firstName: "Alice",
    lastName: "Smith",
    rooms: ["101"],
    financials,
    loans: {
      L1: {
        count: 1,
        createdAt: "",
        depositType: "CASH",
        deposit: 0,
        item: "Umbrella",
        type: "Loan",
      },
    },
    activities: [],
    citizenship: "",
    placeOfBirth: "",
    dateOfBirth: null,
    municipality: "",
    gender: "F",
    isCompleted: false,
  },
];

const bagStorage = { G1: { optedIn: true } };

function setAllHooks({
  loading = false,
  error = null,
  rows = sampleRows,
}: { loading?: boolean; error?: unknown; rows?: typeof sampleRows } = {}) {
  bookingsMock.mockReturnValue({ bookings: null, loading, error });
  guestDetailsMock.mockReturnValue({ guestsDetails: null, loading, error });
  financialsRoomMock.mockReturnValue({
    financialsRoom: null,
    loading,
    error,
  });
  loansMock.mockReturnValue({ loans: null, loading, error });
  activitiesDataMock.mockReturnValue({ activities: null, loading, error });
  activitiesByCodeDataMock.mockReturnValue({
    activitiesByCodes: null,
    loading,
    error,
  });
  checkoutsMock.mockReturnValue({ checkouts: null, loading, error });
  guestByRoomMock.mockReturnValue({ guestByRoom: null, loading, error });
  bagStorageDataMock.mockReturnValue({ bagStorage, loading, error });
  checkoutClientMock.mockReturnValue(rows);
}

describe("/checkout parity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAllHooks();
  });

  it("matches baseline checkout selectors and DOM snapshot", () => {
    const { container } = render(<Checkout />);

    expect(
      screen.getByRole("heading", { name: /checkouts/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /checkout table/i }),
    ).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  it("keeps quick-select date keyboard flow and completion action behavior", async () => {
    jest.useFakeTimers({ toFake: ["Date"] });
    jest.setSystemTime(new Date("2025-01-02T00:00:00Z"));

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    try {
      render(<Checkout />);

      await waitFor(() => {
        expect(checkoutClientMock).toHaveBeenCalled();
      });

      expect(checkoutClientMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          startDate: "2025-01-02",
          endDate: "2025-01-02",
        }),
      );

      const yesterdayButton = screen.getByRole("button", {
        name: /yesterday/i,
      });
      yesterdayButton.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(checkoutClientMock).toHaveBeenLastCalledWith(
          expect.objectContaining({
            startDate: "2025-01-01",
            endDate: "2025-01-01",
          }),
        );
      });

      const completeButton = screen.getByRole("button", {
        name: /complete checkout/i,
      });
      await user.click(completeButton);

      expect(saveActivityMock).toHaveBeenCalledWith("G1", {
        code: 14,
        description: "Manually completed checkout",
      });
      expect(removeLastActivityMock).not.toHaveBeenCalled();
      expect(saveCheckoutMock).toHaveBeenCalledWith("2025-01-01", {
        G1: {
          timestamp: expect.any(String),
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
