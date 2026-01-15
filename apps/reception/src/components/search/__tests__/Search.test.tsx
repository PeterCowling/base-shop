import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../BookingSearchTable", () => ({
  __esModule: true,
  default: () => <div data-testid="booking-table">table</div>,
}));

vi.mock("../FinancialTransactionSearch", () => ({
  __esModule: true,
  default: () => <div data-testid="tx-search">transactions</div>,
}));

vi.mock("../SmallSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));

vi.mock("../../../utils/toastUtils", () => ({ showToast: vi.fn() }));

const bookingSearchClientMock = vi.fn();
vi.mock("../../../hooks/client/useBookingSearchClient", () => ({
  __esModule: true,
  default: (...args: unknown[]) => bookingSearchClientMock(...args),
}));

import Search, { getActivityLevel } from "../Search";
import { showToast } from "../../../utils/toastUtils";

const showToastMock = showToast as unknown as ReturnType<typeof vi.fn>;

describe("Search component", () => {
  beforeEach(() => {
    bookingSearchClientMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("switches between booking and transaction tabs", async () => {
    render(<Search />);

    expect(screen.getByText(/search bookings/i)).toBeInTheDocument();
    expect(screen.getByTestId("booking-table")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /transactions/i }));
    await waitFor(() => expect(screen.getByTestId("tx-search")).toBeInTheDocument());
  });

  it("triggers data fetch when filters change", async () => {
    render(<Search />);

    expect(bookingSearchClientMock).toHaveBeenCalledWith({ skip: true });

    const input = screen.getByLabelText(/first name/i);
    await userEvent.type(input, "Alice");

    await waitFor(() =>
      expect(bookingSearchClientMock).toHaveBeenLastCalledWith({
        firstName: "Alice",
        lastName: "",
        bookingRef: "",
        status: "",
        nonRefundable: "",
        date: "",
        roomNumber: "",
      })
    );
  });

  it("shows errors via toast", async () => {
    bookingSearchClientMock.mockReturnValueOnce({
      data: [],
      loading: false,
      error: new Error("boom"),
    });

    render(<Search />);

    await waitFor(() => expect(showToastMock).toHaveBeenCalledWith("boom", "error"));
  });
});

describe("getActivityLevel", () => {
  it("prioritizes definitive codes", () => {
    const result = getActivityLevel([
      { code: 1, who: "" },
      { code: 7, who: "" },
    ]);
    expect(result).toBe("Auto-cancel no payment");
  });

  it("uses highest priority ordered code", () => {
    const result = getActivityLevel([
      { code: 1, who: "" },
      { code: 8, who: "" },
    ]);
    expect(result).toBe("Room payment made");
  });

  it("defaults to no activity", () => {
    const result = getActivityLevel([{ code: 17, who: "" }]);
    expect(result).toBe("No Activity");
  });
});
