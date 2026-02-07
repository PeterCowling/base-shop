import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Checkout from "../Checkout";

// --- hoist-safe mock placeholders -----------------------------
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
/* eslint-enable  no-var */
// --------------------------------------------------------------

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

jest.mock("../../../context/LoanDataContext", () => {
  removeLoanItemMock = jest.fn().mockResolvedValue(undefined);
  return { useLoanData: () => ({ removeLoanItem: removeLoanItemMock }) };
});

jest.mock("../../../hooks/client/useCheckoutClient", () => {
  checkoutClientMock = jest.fn();
  return { default: (...args: unknown[]) => checkoutClientMock(...args) };
});

jest.mock("../../../hooks/data/useBookingsData", () => {
  bookingsMock = jest.fn();
  return { default: () => bookingsMock() };
});
jest.mock("../../../hooks/data/useGuestDetails", () => {
  guestDetailsMock = jest.fn();
  return { default: () => guestDetailsMock() };
});
jest.mock("../../../hooks/data/useFinancialsRoom", () => {
  financialsRoomMock = jest.fn();
  return { default: () => financialsRoomMock() };
});
jest.mock("../../../hooks/data/useLoans", () => {
  loansMock = jest.fn();
  return { default: () => loansMock() };
});
jest.mock("../../../hooks/data/useActivitiesData", () => {
  activitiesDataMock = jest.fn();
  return { default: () => activitiesDataMock() };
});
jest.mock("../../../hooks/data/useActivitiesByCodeData", () => {
  activitiesByCodeDataMock = jest.fn();
  return { default: () => activitiesByCodeDataMock() };
});
jest.mock("../../../hooks/data/useCheckouts", () => {
  checkoutsMock = jest.fn();
  return { useCheckouts: () => checkoutsMock() };
});
jest.mock("../../../hooks/data/useGuestByRoom", () => {
  guestByRoomMock = jest.fn();
  return { default: () => guestByRoomMock() };
});
jest.mock("../../../hooks/data/useBagStorageData", () => {
  bagStorageDataMock = jest.fn();
  return { default: () => bagStorageDataMock() };
});

jest.mock("../../../hooks/mutations/useActivitiesMutations", () => {
  saveActivityMock = jest.fn().mockResolvedValue({ success: true });
  removeLastActivityMock = jest.fn().mockResolvedValue({ success: true });
  return {
    default: () => ({
      saveActivity: saveActivityMock,
      removeLastActivity: removeLastActivityMock,
    }),
  };
});

jest.mock("../../../hooks/mutations/useCheckoutsMutation", () => {
  saveCheckoutMock = jest.fn().mockResolvedValue(undefined);
  return { useCheckoutsMutation: () => ({ saveCheckout: saveCheckoutMock }) };
});

jest.mock("../../../hooks/mutations/useAllTransactionsMutations", () => {
  addToAllTransactionsMock = jest.fn();
  return { default: () => ({ addToAllTransactions: addToAllTransactionsMock }) };
});

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

describe("Checkout component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    setAllHooks({ loading: true });
    render(<Checkout />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error message", () => {
    setAllHooks({ error: "boom" });
    render(<Checkout />);
    expect(
      screen.getByText(/error loading checkout data: boom/i)
    ).toBeInTheDocument();
  });

  it("renders table data and triggers callbacks", async () => {
    setAllHooks();
    render(<Checkout />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();

    const loanBtn = screen.getByRole("button", { name: /remove umbrella/i });
    await userEvent.click(loanBtn);
    expect(removeLoanItemMock).toHaveBeenCalledWith(
      "BR1",
      "G1",
      "L1",
      "Umbrella",
      "CASH"
    );
    expect(addToAllTransactionsMock).toHaveBeenCalled();

    const completeBtn = screen.getByRole("button", {
      name: /complete checkout/i,
    });
    await userEvent.click(completeBtn);
    expect(saveActivityMock).toHaveBeenCalledWith("G1", {
      code: 14,
      description: "Manually completed checkout",
    });
    expect(removeLastActivityMock).not.toHaveBeenCalled();
    expect(saveCheckoutMock).toHaveBeenCalledWith(
      "2025-01-01",
      {
        G1: {
          timestamp: expect.any(String),
        },
      }
    );
  });

  it("logs keycard returns with the isKeycard flag", async () => {
    const keycardRows = [
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
            deposit: 10,
            item: "Keycard",
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

    setAllHooks({ rows: keycardRows });
    render(<Checkout />);
    const loanBtn = screen.getByRole("button", { name: /remove keycard/i });
    await userEvent.click(loanBtn);

    expect(addToAllTransactionsMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ isKeycard: true })
    );
  });

  it("applies dark mode classes when html has dark", () => {
    document.documentElement.classList.add("dark");
    setAllHooks();
    render(<Checkout />);

    const heading = screen.getByRole("heading", { name: /checkouts/i });
    const outer = heading.parentElement as HTMLElement;
    expect(outer.className).toContain("dark:bg-darkBg");
    expect(outer.className).toContain("dark:text-darkAccentGreen");

    const tableWrapper = screen.getByRole("table", { name: /checkout table/i }).parentElement as HTMLElement;
    expect(tableWrapper.className).toContain("dark:bg-darkSurface");

    const todayBtn = screen.getByRole("button", { name: /today/i });
    const dateContainer = todayBtn.closest<HTMLDivElement>("div.relative");
    expect(dateContainer?.className).toContain("dark:bg-darkSurface");

    document.documentElement.classList.remove("dark");
  });
});
