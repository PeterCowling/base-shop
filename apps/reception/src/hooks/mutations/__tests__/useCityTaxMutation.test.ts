import { act, renderHook } from "@testing-library/react";

import useCityTaxMutation from "../useCityTaxMutation";

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

describe("useCityTaxMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFirebaseDatabaseMock.mockReturnValue({});
    refMock.mockImplementation((_db: unknown, path?: string) => ({ path: path ?? "" }));
    updateMock.mockResolvedValue(undefined);
  });

  // TC-01: Initial state
  it("returns loading=false and error=null initially", () => {
    const { result } = renderHook(() => useCityTaxMutation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-02: Success path — saves city tax data via update
  it("calls update at cityTax/{bookingRef}/{occupantId}", async () => {
    const { result } = renderHook(() => useCityTaxMutation());
    const taxData = { amount: 5, paid: true };

    await act(async () => {
      await result.current.saveCityTax("BOOK123", "OCC456", taxData);
    });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: "cityTax/BOOK123/OCC456" }),
      taxData
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-03: Error path — sets error and rethrows when update fails
  it("sets error state and rethrows when update fails", async () => {
    const dbError = new Error("Firebase write failed");
    updateMock.mockRejectedValue(dbError);

    const { result } = renderHook(() => useCityTaxMutation());

    await expect(
      act(async () => {
        await result.current.saveCityTax("BOOK123", "OCC456", { amount: 5 });
      })
    ).rejects.toThrow("Firebase write failed");

    expect(result.current.error).toBe(dbError);
    expect(result.current.loading).toBe(false);
  });
});
