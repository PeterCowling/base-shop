import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useBleepersData } from "../useBleepersData";

/* eslint-disable no-var */
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

const databaseMock = {};

vi.mock("firebase/database", () => {
  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  getMock = vi.fn();
  setMock = vi.fn();
  return {
    ref: (...args: unknown[]) => refMock(...args),
    get: (...args: unknown[]) => getMock(...args),
    set: (...args: unknown[]) => setMock(...args),
  };
});

vi.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => databaseMock,
}));

vi.mock("../../useFirebaseSubscription");
const mockedSub = vi.mocked(useFirebaseSubscription);

function snap(val: unknown) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  };
}

describe("useBleepersData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes bleeper data when missing", async () => {
    mockedSub.mockReturnValue({ data: {}, loading: false, error: null });
    getMock.mockResolvedValueOnce(snap(null));

    renderHook(() => useBleepersData());

    await waitFor(() => expect(setMock).toHaveBeenCalledTimes(1));
    const init = setMock.mock.calls[0][1];
    expect(init[1]).toBe(true);
    expect(init[18]).toBe(true);
  });

  it("does not initialize when data exists", async () => {
    mockedSub.mockReturnValue({
      data: { 1: true },
      loading: false,
      error: null,
    });
    getMock.mockResolvedValueOnce(snap({ 1: true }));

    const { result } = renderHook(() => useBleepersData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(setMock).not.toHaveBeenCalled();
    expect(result.current.bleepers).toEqual({ 1: true });
  });

  it("forwards loading and error", async () => {
    const err = new Error("fail");
    mockedSub.mockReturnValue({ data: {}, loading: true, error: err });

    const { result } = renderHook(() => useBleepersData());

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(err);
    });
  });
});
