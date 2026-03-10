import { act, renderHook } from "@testing-library/react";

import useVoidTransaction from "../useVoidTransaction";

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

const mockUser = {
  user_name: "teststaff",
  uid: "uid_123",
};

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("../../../utils/shiftId", () => ({
  getStoredShiftId: () => "shift_001",
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2026-03-09T10:00:00.000Z",
}));

jest.mock("../../../utils/toastUtils", () => ({
  showToast: jest.fn(),
}));

// Mock useFinancialsRoomMutations to avoid its internal complexity
const saveFinancialsRoomMock = jest.fn();
jest.mock("../useFinancialsRoomMutations", () => ({
  __esModule: true,
  default: () => ({ saveFinancialsRoom: saveFinancialsRoomMock, error: null }),
}));

describe("useVoidTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFirebaseDatabaseMock.mockReturnValue({});
    refMock.mockImplementation((_db: unknown, path?: string) => ({ path: path ?? "" }));
    updateMock.mockResolvedValue(undefined);
    saveFinancialsRoomMock.mockResolvedValue(undefined);

    // Default: transaction exists and is not voided
    getMock.mockResolvedValue({
      exists: () => true,
      val: () => ({
        bookingRef: "BOOK123",
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
      }),
    });
  });

  // TC-01: Initial state
  it("returns loading=false and error=null initially", () => {
    const { result } = renderHook(() => useVoidTransaction());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-02: Success path — writes void fields to allFinancialTransactions
  it("writes void fields when transaction exists and is not already voided", async () => {
    const { result } = renderHook(() => useVoidTransaction());

    await act(async () => {
      await result.current.voidTransaction("TXN_001", "duplicate charge");
    });

    expect(updateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        "allFinancialTransactions/TXN_001/voidReason": "duplicate charge",
        "allFinancialTransactions/TXN_001/voidedBy": "teststaff",
      })
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-03: Error path — sets error and rethrows when update fails
  it("sets error state and rethrows when update fails", async () => {
    const dbError = new Error("Network error");
    // First get (txn snapshot) succeeds, update fails
    getMock.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ bookingRef: null, voidedAt: null, voidedBy: null, voidReason: null }),
    });
    updateMock.mockRejectedValue(dbError);

    const { result } = renderHook(() => useVoidTransaction());

    await expect(
      act(async () => {
        await result.current.voidTransaction("TXN_001", "test reason");
      })
    ).rejects.toThrow("Network error");

    expect(result.current.error).toBe(dbError);
    expect(result.current.loading).toBe(false);
  });
});
