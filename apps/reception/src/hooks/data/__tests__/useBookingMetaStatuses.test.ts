import { act, renderHook } from "@testing-library/react";
import { onValue } from "firebase/database";

import useBookingMetaStatuses from "../useBookingMetaStatuses";

const useFirebaseDatabaseMock = jest.fn();
const onValueMock = onValue as jest.Mock;

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("firebase/database", () => ({
  ref: jest.fn((_db: unknown, path: string) => ({ path })),
  onValue: jest.fn(),
}));

describe("useBookingMetaStatuses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFirebaseDatabaseMock.mockReturnValue({});
    onValueMock.mockReturnValue(jest.fn()); // Default unsubscribe function
  });

  // TC-01: Hook fetches status for provided booking refs
  it("subscribes to bookingMeta status paths for each booking ref", () => {
    const { result } = renderHook(() =>
      useBookingMetaStatuses(["BOOK1", "BOOK2"])
    );

    expect(onValueMock).toHaveBeenCalledTimes(2);
    expect(onValueMock).toHaveBeenCalledWith(
      { path: "bookingMeta/BOOK1/status" },
      expect.any(Function),
      expect.any(Function)
    );
    expect(onValueMock).toHaveBeenCalledWith(
      { path: "bookingMeta/BOOK2/status" },
      expect.any(Function),
      expect.any(Function)
    );
  });

  // TC-02: Hook returns status map with "cancelled" for cancelled bookings
  it("returns status map with cancelled status", () => {
    onValueMock.mockImplementation((_ref, onData) => {
      // Simulate BOOK1 is cancelled
      if (_ref.path === "bookingMeta/BOOK1/status") {
        onData({ val: () => "cancelled", exists: () => true });
      } else {
        onData({ val: () => null, exists: () => false });
      }
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() =>
      useBookingMetaStatuses(["BOOK1", "BOOK2"])
    );

    act(() => {
      // Wait for async updates
    });

    expect(result.current["BOOK1"]).toBe("cancelled");
    expect(result.current["BOOK2"]).toBeUndefined();
  });

  // TC-03: Hook returns empty map when no booking refs provided
  it("returns empty map for empty booking refs array", () => {
    const { result } = renderHook(() => useBookingMetaStatuses([]));

    expect(onValueMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
  });

  // TC-04: Hook unsubscribes on unmount
  it("unsubscribes from all listeners on unmount", () => {
    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();

    onValueMock
      .mockReturnValueOnce(unsubscribe1)
      .mockReturnValueOnce(unsubscribe2);

    const { unmount } = renderHook(() =>
      useBookingMetaStatuses(["BOOK1", "BOOK2"])
    );

    unmount();

    expect(unsubscribe1).toHaveBeenCalled();
    expect(unsubscribe2).toHaveBeenCalled();
  });

  // TC-05: Hook handles database errors gracefully
  it("logs error when Firebase read fails", () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    onValueMock.mockImplementation((_ref, _onData, onError) => {
      if (_ref.path === "bookingMeta/BOOK1/status") {
        onError(new Error("Permission denied"));
      }
      return jest.fn();
    });

    renderHook(() => useBookingMetaStatuses(["BOOK1"]));

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to fetch status for booking BOOK1:",
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});
