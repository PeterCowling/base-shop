import { act, renderHook } from "@testing-library/react";

import useSaveBooking from "../useBookingMutations";

/* eslint-disable no-var */
var useFirebaseDatabaseMock: jest.Mock;
var refMock: jest.Mock;
var updateMock: jest.Mock;
var useOnlineStatusMock: jest.Mock;
var queueOfflineWriteMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

jest.mock("../../../lib/offline/useOnlineStatus", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

jest.mock("../../../lib/offline/syncManager", () => ({
  queueOfflineWrite: (...args: unknown[]) => queueOfflineWriteMock(...args),
}));

beforeEach(() => {
  useFirebaseDatabaseMock = jest.fn().mockReturnValue({});
  refMock = jest.fn((_db: unknown, path?: string) => ({ path: path ?? "" }));
  updateMock = jest.fn().mockResolvedValue(undefined);
  useOnlineStatusMock = jest.fn().mockReturnValue(true);
  queueOfflineWriteMock = jest.fn().mockResolvedValue(1);
});

describe("useSaveBooking", () => {
  it("calls Firebase update when online", async () => {
    const { result } = renderHook(() => useSaveBooking());

    await act(async () => {
      await result.current.saveBooking("BR1", "occ1", { checkInDate: "2024-01-01" });
    });

    expect(refMock).toHaveBeenCalledWith({}, "bookings/BR1/occ1");
    expect(updateMock).toHaveBeenCalledWith(
      { path: "bookings/BR1/occ1" },
      { checkInDate: "2024-01-01" }
    );
    expect(queueOfflineWriteMock).not.toHaveBeenCalled();
  });

  it("queues the write when offline and IDB is available", async () => {
    useOnlineStatusMock.mockReturnValue(false);

    const { result } = renderHook(() => useSaveBooking());

    await act(async () => {
      await result.current.saveBooking("BR1", "occ1", { checkInDate: "2024-01-01" });
    });

    expect(queueOfflineWriteMock).toHaveBeenCalledWith(
      "bookings/BR1/occ1",
      "update",
      { checkInDate: "2024-01-01" },
      expect.objectContaining({ conflictPolicy: "fail-on-conflict", domain: "bookings" })
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("falls through to Firebase write when offline and IDB is unavailable", async () => {
    useOnlineStatusMock.mockReturnValue(false);
    queueOfflineWriteMock.mockResolvedValue(null);

    const { result } = renderHook(() => useSaveBooking());

    await act(async () => {
      await result.current.saveBooking("BR1", "occ1", { checkInDate: "2024-01-01" });
    });

    expect(queueOfflineWriteMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
  });
});
