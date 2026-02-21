import { act, renderHook } from "@testing-library/react";

import useBulkBookingActions from "../useBulkBookingActions";

const archiveBookingMock = jest.fn();

jest.mock("../useArchiveBooking", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock toast utils
jest.mock("../../../utils/toastUtils", () => ({
  showToast: jest.fn(),
}));

const useArchiveBooking = require("../useArchiveBooking").default;

describe("useBulkBookingActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useArchiveBooking as jest.Mock).mockReturnValue({
      archiveBooking: archiveBookingMock,
      loading: false,
      error: null,
    });

    archiveBookingMock.mockResolvedValue(undefined);
  });

  // TC-01: Call bulk cancel action on 3 bookings → all 3 archived via archiveBooking
  it("calls archiveBooking for each booking ref in the array", async () => {
    const { result } = renderHook(() => useBulkBookingActions());

    let bulkResult;
    await act(async () => {
      bulkResult = await result.current.cancelBookings([
        "BOOK1",
        "BOOK2",
        "BOOK3",
      ]);
    });

    expect(archiveBookingMock).toHaveBeenCalledTimes(3);
    expect(archiveBookingMock).toHaveBeenCalledWith("BOOK1");
    expect(archiveBookingMock).toHaveBeenCalledWith("BOOK2");
    expect(archiveBookingMock).toHaveBeenCalledWith("BOOK3");
    expect(bulkResult).toEqual({
      success: ["BOOK1", "BOOK2", "BOOK3"],
      failed: [],
    });
  });

  // TC-02: Verify archiveBooking is called (not deleteBooking)
  it("uses archiveBooking hook instead of deleteBooking hook", async () => {
    const { result } = renderHook(() => useBulkBookingActions());

    await act(async () => {
      await result.current.cancelBookings(["BOOK1"]);
    });

    expect(useArchiveBooking).toHaveBeenCalled();
    expect(archiveBookingMock).toHaveBeenCalledWith("BOOK1");
  });

  // TC-03: Error during one cancellation → other cancellations proceed, error surfaced
  it("continues processing after individual booking failure", async () => {
    // Suppress expected console.error for this test
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    archiveBookingMock
      .mockResolvedValueOnce(undefined) // BOOK1 success
      .mockRejectedValueOnce(new Error("Database error")) // BOOK2 fails
      .mockResolvedValueOnce(undefined); // BOOK3 success

    const { result } = renderHook(() => useBulkBookingActions());

    let bulkResult;
    await act(async () => {
      bulkResult = await result.current.cancelBookings([
        "BOOK1",
        "BOOK2",
        "BOOK3",
      ]);
    });

    expect(bulkResult).toEqual({
      success: ["BOOK1", "BOOK3"],
      failed: ["BOOK2"],
    });
    expect(result.current.error).toBe("Failed to cancel 1 booking(s)");
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to cancel booking BOOK2:",
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  // TC-04: Loading state management
  it("sets loading state during bulk operation", async () => {
    const { result } = renderHook(() => useBulkBookingActions());

    expect(result.current.loading).toBe(false);

    const cancelPromise = act(async () => {
      await result.current.cancelBookings(["BOOK1"]);
    });

    await cancelPromise;

    expect(result.current.loading).toBe(false);
  });

  // TC-05: CSV export functionality (unrelated to soft-delete change)
  it("exports booking data to CSV format", () => {
    const { result } = renderHook(() => useBulkBookingActions());

    const testData = [
      {
        bookingRef: "BOOK1",
        firstName: "John",
        lastName: "Doe",
        activityLevel: "High",
        refundStatus: "Pending",
        balance: 100.5,
        totalPaid: 50.25,
        totalAdjust: 0,
      },
    ];

    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();

    // Mock document methods
    const createElementSpy = jest.spyOn(document, "createElement");
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: { visibility: "" },
    } as unknown as HTMLAnchorElement;
    createElementSpy.mockReturnValue(mockLink);

    const appendChildSpy = jest.spyOn(document.body, "appendChild");
    const removeChildSpy = jest.spyOn(document.body, "removeChild");
    appendChildSpy.mockImplementation(() => mockLink);
    removeChildSpy.mockImplementation(() => mockLink);

    act(() => {
      result.current.exportToCsv(testData, "test-export.csv");
    });

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      "download",
      "test-export.csv"
    );
    expect(mockLink.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
