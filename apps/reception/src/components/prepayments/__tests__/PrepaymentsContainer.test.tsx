/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render, waitFor } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { PrepaymentsViewProps } from "../PrepaymentsView";
import type { BookingPaymentItem } from "../BookingPaymentsLists";

let capturedProps: PrepaymentsViewProps | null = null;

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var prepaymentDataMock: ReturnType<typeof vi.fn>;
var addActivityMock: ReturnType<typeof vi.fn>;
var logActivityMock: ReturnType<typeof vi.fn>;
var addToAllTransactionsMock: ReturnType<typeof vi.fn>;
var saveCCDetailsMock: ReturnType<typeof vi.fn>;
var saveFinancialsRoomMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                       */
/* ------------------------------------------------------------------ */
vi.mock("../PrepaymentsView", () => ({
  __esModule: true,
  default: (props: PrepaymentsViewProps) => {
    capturedProps = props;
    return <div data-testid="view" />;
  },
}));

vi.mock("../../../hooks/client/checkin/usePrepaymentData", () => {
  prepaymentDataMock = vi.fn();
  return { __esModule: true, default: () => prepaymentDataMock() };
});

vi.mock("../../../hooks/mutations/useActivitiesMutations", () => {
  addActivityMock = vi.fn();
  logActivityMock = vi.fn();
  return {
    __esModule: true,
    default: () => ({ addActivity: addActivityMock, logActivity: logActivityMock }),
  };
});

vi.mock("../../../hooks/mutations/useAllTransactionsMutations", () => {
  addToAllTransactionsMock = vi.fn();
  return { __esModule: true, default: () => ({ addToAllTransactions: addToAllTransactionsMock }) };
});

vi.mock("../../../hooks/mutations/useCCDetailsMutations", () => {
  saveCCDetailsMock = vi.fn();
  return { __esModule: true, default: () => ({ saveCCDetails: saveCCDetailsMock }) };
});

vi.mock("../../../hooks/mutations/useFinancialsRoomMutations", () => {
  saveFinancialsRoomMock = vi.fn();
  return { __esModule: true, default: () => ({ saveFinancialsRoom: saveFinancialsRoomMock }) };
});

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Pete" } }),
}));

vi.mock("../../../utils/generateTransactionId", () => ({
  generateTransactionId: () => "txn123",
}));

import PrepaymentsContainer from "../PrepaymentsContainer";

const sampleData = [
  {
    occupantId: "1",
    bookingRef: "AAA",
    occupantName: "Alice",
    ccCardNumber: "1111",
    ccExpiry: "12/25",
    codes: [21],
    hoursElapsed21: 5,
    hoursElapsed5: null,
    hoursElapsed6: null,
    amountToCharge: 100,
    checkInDate: "2025-01-01",
  },
  {
    occupantId: "2",
    bookingRef: "BBB",
    occupantName: "Bob",
    ccCardNumber: "2222",
    ccExpiry: "11/24",
    codes: [5],
    hoursElapsed21: null,
    hoursElapsed5: 10,
    hoursElapsed6: null,
    amountToCharge: 50,
    checkInDate: "2025-01-02",
  },
  {
    occupantId: "3",
    bookingRef: "CCC",
    occupantName: "Carol",
    ccCardNumber: "3333",
    ccExpiry: "10/23",
    codes: [6],
    hoursElapsed21: null,
    hoursElapsed5: null,
    hoursElapsed6: 2,
    amountToCharge: 0,
    checkInDate: "2025-01-03",
  },
];

const setMessageMock = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

function renderComponent() {
  render(<PrepaymentsContainer setMessage={setMessageMock} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedProps = null;
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  prepaymentDataMock.mockReturnValue({ relevantData: sampleData, loading: false, error: null });
  addActivityMock.mockResolvedValue(undefined);
  logActivityMock.mockResolvedValue(undefined);
  addToAllTransactionsMock.mockResolvedValue(undefined);
  saveCCDetailsMock.mockResolvedValue(undefined);
  saveFinancialsRoomMock.mockResolvedValue(undefined);
});

afterEach(() => {
  consoleErrorSpy?.mockRestore();
});

describe("PrepaymentsContainer", () => {
  it("filters bookings by booking reference and name", async () => {
    renderComponent();
    expect(capturedProps?.code21List).toHaveLength(1);
    expect(capturedProps?.code5List).toHaveLength(1);
    expect(capturedProps?.code6List).toHaveLength(1);

    act(() => {
      capturedProps?.setFilterText("bbb");
    });
    await waitFor(() => expect(capturedProps?.code5List).toHaveLength(1));
    expect(capturedProps?.code21List).toHaveLength(0);
    expect(capturedProps?.code6List).toHaveLength(0);

    act(() => {
      capturedProps?.setFilterText("car");
    });
    await waitFor(() => expect(capturedProps?.code6List).toHaveLength(1));
    expect(capturedProps?.code21List).toHaveLength(0);
    expect(capturedProps?.code5List).toHaveLength(0);
  });

  it("handles invalid amount when marking as paid", async () => {
    renderComponent();
    const props = capturedProps as NonNullable<typeof capturedProps>;
    const invalidItem = props.code6List[0] as BookingPaymentItem;
    await act(async () => {
      await props.handleMarkAsPaid(invalidItem);
    });
    expect(addToAllTransactionsMock).not.toHaveBeenCalled();
    expect(setMessageMock).toHaveBeenCalledWith(
      expect.stringMatching(/invalid/i)
    );
  });

  it("marks booking as paid successfully", async () => {
    renderComponent();
    const props = capturedProps as NonNullable<typeof capturedProps>;
    const validItem = props.code5List[0] as BookingPaymentItem;
    await act(async () => {
      await props.handleMarkAsPaid(validItem);
    });
    expect(addToAllTransactionsMock).toHaveBeenCalled();
    expect(saveFinancialsRoomMock).toHaveBeenCalled();
    expect(addActivityMock).toHaveBeenCalledWith("2", 8);
    await waitFor(() =>
      expect(capturedProps?.lastCompletedBooking?.bookingRef).toBe("BBB")
    );
  });

  it("ignores delete when booking not found", () => {
    renderComponent();
    act(() => {
      capturedProps?.handleRowClickForDelete({
        bookingRef: "ZZZ",
        occupantId: "99",
        occupantName: "Ghost",
        amountToCharge: 0,
        hoursElapsed: null,
        codes: [],
      });
    });
    expect(capturedProps?.bookingToDelete).toBeNull();
  });

  it("processes failed payment attempt", async () => {
    renderComponent();
    let props = capturedProps as NonNullable<typeof capturedProps>;
    act(() => {
      const booking = props.code5List[0];
      if (!booking) throw new Error("Booking not found");
      props.handleOpenBooking(booking);
    });
    await waitFor(() => expect(capturedProps?.showEntryDialog).toBe(true));
    props = capturedProps as NonNullable<typeof capturedProps>;
    await act(async () => {
      await props.handleProcessPaymentAttempt("failed");
    });
    expect(addActivityMock).toHaveBeenCalledWith("2", 6);
    expect(setMessageMock).toHaveBeenCalledWith(
      expect.stringMatching(/failed/i)
    );
  });

  it("processes successful payment attempt", async () => {
    renderComponent();
    let props = capturedProps as NonNullable<typeof capturedProps>;
    act(() => {
      const booking = props.code5List[0];
      if (!booking) throw new Error("Booking not found");
      props.handleOpenBooking(booking);
    });
    await waitFor(() => expect(capturedProps?.showEntryDialog).toBe(true));
    props = capturedProps as NonNullable<typeof capturedProps>;
    await act(async () => {
      await props.handleProcessPaymentAttempt("paid");
    });
    expect(addToAllTransactionsMock).toHaveBeenCalled();
    expect(saveFinancialsRoomMock).toHaveBeenCalled();
    await waitFor(() => expect(capturedProps?.showEntryDialog).toBe(false));
    expect(capturedProps?.lastCompletedBooking?.bookingRef).toBe("BBB");
  });

  it("rejects payment with invalid amount", async () => {
    renderComponent();
    let props = capturedProps as NonNullable<typeof capturedProps>;
    act(() => {
      const booking = props.code6List[0];
      if (!booking) throw new Error("Booking not found");
      props.handleOpenBooking(booking);
    });
    await waitFor(() => expect(capturedProps?.showEntryDialog).toBe(true));
    props = capturedProps as NonNullable<typeof capturedProps>;
    await act(async () => {
      await props.handleProcessPaymentAttempt("paid");
    });
    expect(addToAllTransactionsMock).not.toHaveBeenCalled();
    expect(setMessageMock).toHaveBeenCalledWith(
      expect.stringMatching(/invalid/i)
    );
    expect(capturedProps?.showEntryDialog).toBe(true);
  });

  it("saves or updates card data", async () => {
    renderComponent();
    let props = capturedProps as NonNullable<typeof capturedProps>;
    act(() => {
      const booking = props.code21List[0];
      if (!booking) throw new Error("Booking not found");
      props.handleOpenBooking(booking);
    });
    await waitFor(() =>
      expect(capturedProps?.selectedBooking?.bookingRef).toBe("AAA")
    );
    props = capturedProps as NonNullable<typeof capturedProps>;
    await act(async () => {
      await props.handleSaveOrUpdateCardData({
        cardNumber: "4444",
        expiry: "11/30",
      });
    });
    expect(saveCCDetailsMock).toHaveBeenCalledWith("AAA", "1", {
      ccNum: "4444",
      expDate: "11/30",
    });
    expect(setMessageMock).toHaveBeenCalledWith(
      expect.stringMatching(/card for reservation AAA/i)
    );
    await waitFor(() =>
      expect(capturedProps?.selectedBooking?.ccCardNumber).toBe("4444")
    );
  });

  it("prevents saving card data without selection", async () => {
    renderComponent();
    const props = capturedProps as NonNullable<typeof capturedProps>;
    await act(async () => {
      await props.handleSaveOrUpdateCardData({
        cardNumber: "4444",
        expiry: "11/30",
      });
    });
    expect(saveCCDetailsMock).not.toHaveBeenCalled();
    expect(setMessageMock).toHaveBeenCalledWith(
      expect.stringMatching(/booking context/i)
    );
  });

  it("handles closing dialogs", async () => {
    renderComponent();
    let props = capturedProps as NonNullable<typeof capturedProps>;
    act(() => {
      const booking = props.code21List[0];
      if (!booking) throw new Error("Booking not found");
      props.handleOpenBooking(booking);
    });
    await waitFor(() => expect(capturedProps?.showEntryDialog).toBe(true));
    props = capturedProps as NonNullable<typeof capturedProps>;
    act(() => {
      props.handleCloseDialogs();
    });
    await waitFor(() => expect(capturedProps?.showEntryDialog).toBe(false));
    expect(capturedProps?.selectedBooking).toBeNull();
  });
});

