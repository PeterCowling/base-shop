import { act, renderHook } from "@testing-library/react";

import useBookingMetaStatuses from "../useBookingMetaStatuses";

/* ------------------------------------------------------------------ */
/*  Mocks                                                             */
/* ------------------------------------------------------------------ */
const useFirebaseDatabaseMock = jest.fn();

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

let capturedCallback: ((snap: unknown) => void) | null = null;
let capturedErrorCallback: ((err: unknown) => void) | null = null;
const unsubscribeMock = jest.fn();
const onValueMock = jest.fn();
const refMock = jest.fn((_db: unknown, path: string) => ({ path }));

jest.mock("firebase/database", () => ({
  ref: refMock,
  onValue: onValueMock,
}));

function makeSnapshot(data: unknown) {
  return {
    exists: () => data !== null,
    val: () => data,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe("useBookingMetaStatuses (subtree pattern)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallback = null;
    capturedErrorCallback = null;
    useFirebaseDatabaseMock.mockReturnValue({});
    unsubscribeMock.mockReset();

    onValueMock.mockImplementation(
      (
        _refObj: unknown,
        cb: (snap: unknown) => void,
        errCb: (err: unknown) => void
      ) => {
        capturedCallback = cb;
        capturedErrorCallback = errCb;
        return unsubscribeMock;
      }
    );
  });

  // TC-01: Single onValue on bookingMeta root regardless of bookingRefs length
  it("TC-01: registers exactly one onValue listener on the bookingMeta root", () => {
    renderHook(() => useBookingMetaStatuses(["BOOK1", "BOOK2", "BOOK3"]));

    expect(onValueMock).toHaveBeenCalledTimes(1);
    expect(refMock).toHaveBeenCalledWith({}, "bookingMeta");
  });

  // TC-02: Client-side filter — snapshot contains extra refs, only requested appear
  it("TC-02: filters snapshot to only requested booking refs", () => {
    const { result } = renderHook(() =>
      useBookingMetaStatuses(["BOOK1", "BOOK2"])
    );

    act(() => {
      capturedCallback?.(
        makeSnapshot({
          BOOK1: { status: "confirmed" },
          BOOK2: { status: "cancelled" },
          BOOK3: { status: "confirmed" }, // unrequested — must not appear
        })
      );
    });

    expect(result.current["BOOK1"]).toBe("confirmed");
    expect(result.current["BOOK2"]).toBe("cancelled");
    expect(result.current["BOOK3"]).toBeUndefined();
  });

  // TC-03: Empty bookingRefs → no subscription opened, returns {}
  it("TC-03: empty bookingRefs array prevents subscription", () => {
    const { result } = renderHook(() => useBookingMetaStatuses([]));

    expect(onValueMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
  });

  // TC-04: Ref in bookingRefs but absent from snapshot → status is undefined
  it("TC-04: booking ref absent from snapshot has undefined status", () => {
    const { result } = renderHook(() =>
      useBookingMetaStatuses(["BOOK1", "BOOK2"])
    );

    act(() => {
      // BOOK2 is absent from the snapshot
      capturedCallback?.(
        makeSnapshot({
          BOOK1: { status: "confirmed" },
        })
      );
    });

    expect(result.current["BOOK1"]).toBe("confirmed");
    expect(result.current["BOOK2"]).toBeUndefined();
  });

  // TC-05: status field present and equals "cancelled"
  it("TC-05: returns cancelled status from snapshot", () => {
    const { result } = renderHook(() =>
      useBookingMetaStatuses(["BOOK1"])
    );

    act(() => {
      capturedCallback?.(
        makeSnapshot({ BOOK1: { status: "cancelled" } })
      );
    });

    expect(result.current["BOOK1"]).toBe("cancelled");
  });

  // TC-06: bookingRefs change → old listener unsubscribed, new listener registered
  it("TC-06: changing bookingRefs triggers re-subscribe", () => {
    let refs: readonly string[] = ["BOOK1"];
    const { rerender } = renderHook(() => useBookingMetaStatuses(refs));

    expect(onValueMock).toHaveBeenCalledTimes(1);
    expect(unsubscribeMock).not.toHaveBeenCalled();

    refs = ["BOOK1", "BOOK2"];
    rerender();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(onValueMock).toHaveBeenCalledTimes(2);
  });

  // TC-07: Unmount → unsubscribe called exactly once
  it("TC-07: unsubscribes on unmount", () => {
    const { unmount } = renderHook(() =>
      useBookingMetaStatuses(["BOOK1", "BOOK2"])
    );

    expect(unsubscribeMock).not.toHaveBeenCalled();
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  // Firebase error → logged via console.error
  it("logs error when Firebase listener errors", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    renderHook(() => useBookingMetaStatuses(["BOOK1"]));

    act(() => {
      capturedErrorCallback?.(new Error("Permission denied"));
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to fetch bookingMeta statuses:",
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});
