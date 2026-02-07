import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { showToast } from "../../../utils/toastUtils";
import Search, { getActivityLevel } from "../Search";

jest.mock("../BookingSearchTable", () => ({
  __esModule: true,
  default: () => <div data-cy="booking-table">table</div>,
}));

jest.mock("../FinancialTransactionSearch", () => ({
  __esModule: true,
  default: () => <div data-cy="tx-search">transactions</div>,
}));

jest.mock("../FinancialTransactionAuditSearch", () => ({
  __esModule: true,
  default: () => <div data-cy="audit-search">audits</div>,
}));

jest.mock("../SmallSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));

const bookingSearchClientMock = jest.fn();
jest.mock("../../../hooks/client/useBookingSearchClient", () => ({
  __esModule: true,
  default: (...args: unknown[]) => bookingSearchClientMock(...args),
}));

const showToastMock = showToast as unknown as jest.Mock;

describe("Search component", () => {
  beforeEach(() => {
    bookingSearchClientMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("switches between booking and transaction tabs", async () => {
    render(<Search />);

    expect(screen.getByText(/search bookings/i)).toBeInTheDocument();
    expect(screen.getByTestId("booking-table")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /transactions/i }));
    await waitFor(() => expect(screen.getByTestId("tx-search")).toBeInTheDocument());
  });

  it("switches to audit tab", async () => {
    render(<Search />);

    await userEvent.click(screen.getByRole("button", { name: /audits/i }));
    await waitFor(() =>
      expect(screen.getByTestId("audit-search")).toBeInTheDocument()
    );
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
