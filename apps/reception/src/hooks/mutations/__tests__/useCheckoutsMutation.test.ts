import { act, renderHook } from "@testing-library/react";

import { useCheckoutsMutation } from "../useCheckoutsMutation";

const useFirebaseDatabaseMock = jest.fn();
const refMock = jest.fn();
const updateMock = jest.fn();

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

describe("useCheckoutsMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFirebaseDatabaseMock.mockReturnValue({});
    refMock.mockImplementation((_db: unknown, path?: string) => ({ path: path ?? "" }));
    updateMock.mockResolvedValue(undefined);
  });

  // TC-01: Initial state — loading=false
  it("returns loading=false and error=null initially", () => {
    const { result } = renderHook(() => useCheckoutsMutation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-02: saveCheckout calls Firebase update at checkouts/{dateKey}
  it("calls update at checkouts/{dateKey} with provided data", async () => {
    const { result } = renderHook(() => useCheckoutsMutation());
    const checkoutData = { OCC_001: { reservationCode: "BOOK123", timestamp: "2026-03-09T10:00:00Z" } };

    await act(async () => {
      await result.current.saveCheckout("2026-03-09", checkoutData);
    });

    expect(refMock).toHaveBeenCalledWith(expect.anything(), "checkouts/2026-03-09");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: "checkouts/2026-03-09" }),
      checkoutData
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-03: when database not initialized → error set, error thrown
  it("sets error state and rethrows when database is not initialized", async () => {
    const dbError = new Error("Database not initialized");
    useFirebaseDatabaseMock.mockReturnValue(null);
    refMock.mockImplementation(() => {
      throw dbError;
    });

    const { result } = renderHook(() => useCheckoutsMutation());

    await expect(
      act(async () => {
        await result.current.saveCheckout("2026-03-09", {});
      })
    ).rejects.toThrow("Database not initialized");

    expect(result.current.error).toBe(dbError);
    expect(result.current.loading).toBe(false);
  });
});
