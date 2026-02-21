import { act, renderHook } from "@testing-library/react";

import useArchiveBooking from "../useArchiveBooking";

const useFirebaseDatabaseMock = jest.fn();
const getMock = jest.fn();
const refMock = jest.fn();
const updateMock = jest.fn();

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("firebase/database", () => ({
  get: (...args: unknown[]) => getMock(...args),
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

describe("useArchiveBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useFirebaseDatabaseMock.mockReturnValue({});
    refMock.mockImplementation((_db: unknown, path?: string) => ({ path: path ?? "" }));
    updateMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue({
      exists: () => false,
      val: () => null,
    });
  });

  // TC-01: Call useArchiveBooking with valid bookingRef → writes status="cancelled" to /bookingMeta/{ref}/status
  it("writes status=cancelled to /bookingMeta path", async () => {
    const { result } = renderHook(() => useArchiveBooking());

    await act(async () => {
      await result.current.archiveBooking("BOOK123");
    });

    expect(updateMock).toHaveBeenCalledWith(
      { path: "" },
      expect.objectContaining({
        "bookingMeta/BOOK123/status": "cancelled",
      })
    );
  });

  // TC-02: Occupant data at /bookings/{ref}/* remains intact (not deleted)
  it("does not delete occupant data from /bookings path", async () => {
    const { result } = renderHook(() => useArchiveBooking());

    await act(async () => {
      await result.current.archiveBooking("BOOK123");
    });

    const updateCall = updateMock.mock.calls[0][1] as Record<string, unknown>;
    const bookingsKeys = Object.keys(updateCall).filter((key) =>
      key.startsWith("bookings/")
    );

    expect(bookingsKeys.length).toBe(0);
  });

  // TC-03: Activities at /activities/{occupantId}/* remain intact (not deleted)
  it("does not delete activities", async () => {
    const { result } = renderHook(() => useArchiveBooking());

    await act(async () => {
      await result.current.archiveBooking("BOOK123");
    });

    const updateCall = updateMock.mock.calls[0][1] as Record<string, unknown>;
    const activityKeys = Object.keys(updateCall).filter((key) =>
      key.startsWith("activities/")
    );

    expect(activityKeys.length).toBe(0);
  });

  // TC-04: cancelledAt timestamp written in ISO format
  it("writes cancelledAt timestamp in ISO format", async () => {
    const { result } = renderHook(() => useArchiveBooking());

    await act(async () => {
      await result.current.archiveBooking("BOOK123");
    });

    const updateCall = updateMock.mock.calls[0][1] as Record<string, unknown>;
    const cancelledAt = updateCall["bookingMeta/BOOK123/cancelledAt"] as string;

    expect(cancelledAt).toBeDefined();
    expect(typeof cancelledAt).toBe("string");
    // Verify ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ or with timezone)
    expect(cancelledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  // TC-05: cancellationSource defaults to "staff" if not provided
  it("defaults cancellationSource to staff when not provided", async () => {
    const { result } = renderHook(() => useArchiveBooking());

    await act(async () => {
      await result.current.archiveBooking("BOOK123");
    });

    expect(updateMock).toHaveBeenCalledWith(
      { path: "" },
      expect.objectContaining({
        "bookingMeta/BOOK123/cancellationSource": "staff",
      })
    );
  });

  it("uses provided cancellationSource when specified", async () => {
    const { result } = renderHook(() => useArchiveBooking());

    await act(async () => {
      await result.current.archiveBooking("BOOK123", "Customer requested", "octorate");
    });

    expect(updateMock).toHaveBeenCalledWith(
      { path: "" },
      expect.objectContaining({
        "bookingMeta/BOOK123/cancellationSource": "octorate",
      })
    );
  });

  // TC-06: Error handling: invalid bookingRef → throws descriptive error
  it("throws error when database not initialized", async () => {
    useFirebaseDatabaseMock.mockReturnValue(null);

    const { result } = renderHook(() => useArchiveBooking());

    await expect(
      act(async () => {
        await result.current.archiveBooking("BOOK123");
      })
    ).rejects.toThrow("Database not initialized");
  });

  it("exposes loading and error state", async () => {
    const { result } = renderHook(() => useArchiveBooking());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
