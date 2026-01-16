/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- hoist-safe mock placeholders -----------------------------
/* eslint-disable no-var */
var checkoutClientMock: ReturnType<typeof vi.fn>;
var bookingsMock: ReturnType<typeof vi.fn>;
var guestDetailsMock: ReturnType<typeof vi.fn>;
var financialsRoomMock: ReturnType<typeof vi.fn>;
var loansMock: ReturnType<typeof vi.fn>;
var activitiesDataMock: ReturnType<typeof vi.fn>;
var activitiesByCodeDataMock: ReturnType<typeof vi.fn>;
var checkoutsMock: ReturnType<typeof vi.fn>;
var guestByRoomMock: ReturnType<typeof vi.fn>;
var bagStorageDataMock: ReturnType<typeof vi.fn>;
var removeLoanItemMock: ReturnType<typeof vi.fn>;
var saveActivityMock: ReturnType<typeof vi.fn>;
var removeLastActivityMock: ReturnType<typeof vi.fn>;
var addToAllTransactionsMock: ReturnType<typeof vi.fn>;
var saveCheckoutMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */
// --------------------------------------------------------------

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

vi.mock("../../../context/LoanDataContext", () => {
  removeLoanItemMock = vi.fn().mockResolvedValue(undefined);
  return { useLoanData: () => ({ removeLoanItem: removeLoanItemMock }) };
});

vi.mock("../../../hooks/client/useCheckoutClient", () => {
  checkoutClientMock = vi.fn();
  return { default: (...args: unknown[]) => checkoutClientMock(...args) };
});

vi.mock("../../../hooks/data/useBookingsData", () => {
  bookingsMock = vi.fn();
  return { default: () => bookingsMock() };
});
vi.mock("../../../hooks/data/useGuestDetails", () => {
  guestDetailsMock = vi.fn();
  return { default: () => guestDetailsMock() };
});
vi.mock("../../../hooks/data/useFinancialsRoom", () => {
  financialsRoomMock = vi.fn();
  return { default: () => financialsRoomMock() };
});
vi.mock("../../../hooks/data/useLoans", () => {
  loansMock = vi.fn();
  return { default: () => loansMock() };
});
vi.mock("../../../hooks/data/useActivitiesData", () => {
  activitiesDataMock = vi.fn();
  return { default: () => activitiesDataMock() };
});
vi.mock("../../../hooks/data/useActivitiesByCodeData", () => {
  activitiesByCodeDataMock = vi.fn();
  return { default: () => activitiesByCodeDataMock() };
});
vi.mock("../../../hooks/data/useCheckouts", () => {
  checkoutsMock = vi.fn();
  return { useCheckouts: () => checkoutsMock() };
});
vi.mock("../../../hooks/data/useGuestByRoom", () => {
  guestByRoomMock = vi.fn();
  return { default: () => guestByRoomMock() };
});
vi.mock("../../../hooks/data/useBagStorageData", () => {
  bagStorageDataMock = vi.fn();
  return { default: () => bagStorageDataMock() };
});

vi.mock("../../../hooks/mutations/useActivitiesMutations", () => {
  saveActivityMock = vi.fn().mockResolvedValue({ success: true });
  removeLastActivityMock = vi.fn().mockResolvedValue({ success: true });
  return {
    default: () => ({
      saveActivity: saveActivityMock,
      removeLastActivity: removeLastActivityMock,
    }),
  };
});

vi.mock("../../../hooks/mutations/useCheckoutsMutation", () => {
  saveCheckoutMock = vi.fn().mockResolvedValue(undefined);
  return { useCheckoutsMutation: () => ({ saveCheckout: saveCheckoutMock }) };
});

vi.mock("../../../hooks/mutations/useAllTransactionsMutations", () => {
  addToAllTransactionsMock = vi.fn();
  return { default: () => ({ addToAllTransactions: addToAllTransactionsMock }) };
});

import Checkout from "../Checkout";

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
    vi.clearAllMocks();
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
