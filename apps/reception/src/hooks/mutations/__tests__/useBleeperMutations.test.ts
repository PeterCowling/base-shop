import { act, renderHook } from "@testing-library/react";

import { useBleeperMutations } from "../useBleeperMutations";

const useFirebaseDatabaseMock = jest.fn();
const refMock = jest.fn();
const setMock = jest.fn();

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

describe("useBleeperMutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFirebaseDatabaseMock.mockReturnValue({});
    refMock.mockImplementation((_db: unknown, path?: string) => ({ path: path ?? "" }));
    setMock.mockResolvedValue(undefined);
  });

  // TC-01: Initial state
  it("returns loading=false and error=null initially", () => {
    const { result } = renderHook(() => useBleeperMutations());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // TC-02: Success path — sets bleeper availability in Firebase
  it("calls set at bleepers/{number} and returns success result", async () => {
    const { result } = renderHook(() => useBleeperMutations());

    let callResult: Awaited<ReturnType<typeof result.current.setBleeperAvailability>> | undefined;

    await act(async () => {
      callResult = await result.current.setBleeperAvailability(5, true);
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: "bleepers/5" }),
      true
    );
    expect(callResult?.success).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  // TC-03: Invalid bleeper number — returns error result, sets error state
  it("returns error result for invalid bleeperNumber without calling Firebase", async () => {
    const { result } = renderHook(() => useBleeperMutations());

    let callResult: Awaited<ReturnType<typeof result.current.setBleeperAvailability>> | undefined;

    await act(async () => {
      callResult = await result.current.setBleeperAvailability(99, true);
    });

    expect(setMock).not.toHaveBeenCalled();
    expect(callResult?.success).toBe(false);
    expect(typeof callResult?.error).toBe("string");
  });

  // TC-04: Database error — sets error state and returns failure result
  it("sets error state when set throws and returns failure result", async () => {
    const dbError = new Error("Firebase error");
    setMock.mockRejectedValue(dbError);

    const { result } = renderHook(() => useBleeperMutations());

    let callResult: Awaited<ReturnType<typeof result.current.setBleeperAvailability>> | undefined;

    await act(async () => {
      callResult = await result.current.setBleeperAvailability(3, false);
    });

    expect(callResult?.success).toBe(false);
    expect(result.current.error).toBe(dbError);
    expect(result.current.loading).toBe(false);
  });
});
