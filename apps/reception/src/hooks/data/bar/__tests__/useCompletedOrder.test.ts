import "@testing-library/jest-dom";
import { renderHook, waitFor } from "@testing-library/react";
import { useCompletedOrder } from "../useCompletedOrder";

/* eslint-disable no-var */
var refMock: jest.Mock;
var getMock: jest.Mock;
var safeParseMock: jest.Mock;
/* eslint-enable no-var */

const databaseMock = {};

jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  getMock = jest.fn();
  return {
    ref: (...args: unknown[]) => refMock(...args),
    get: (...args: unknown[]) => getMock(...args),
  };
});

jest.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => databaseMock,
}));

jest.mock("../../../../schemas/salesOrderSchema", () => {
  safeParseMock = jest.fn();
  return {
    salesOrderSchema: {
      safeParse: (...args: unknown[]) => safeParseMock(...args),
    },
  };
});

function snap(val: unknown) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  };
}

describe("useCompletedOrder", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed order", async () => {
    const parsed = {
      orderKey: "o1",
      confirmed: true,
      bleepNumber: "1",
      userName: "u",
      time: "10:00",
      paymentMethod: "cash",
      items: [],
    };
    safeParseMock.mockReturnValue({ success: true, data: parsed });
    getMock.mockResolvedValueOnce(snap(parsed));

    const { result } = renderHook(() => useCompletedOrder("o1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(parsed);
    expect(result.current.error).toBeNull();
    expect(refMock).toHaveBeenCalledWith(
      databaseMock,
      "barOrders/completed/o1"
    );
  });

  it("sets error on invalid order data", async () => {
    safeParseMock.mockReturnValue({ success: false, error: new Error("bad") });
    getMock.mockResolvedValueOnce(snap({ foo: "bar" }));

    const { result } = renderHook(() => useCompletedOrder("o2"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it("skips fetch when no txn id", async () => {
    const { result } = renderHook(() => useCompletedOrder(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getMock).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("sets error when get rejects", async () => {
    const err = new Error("fail");
    getMock.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useCompletedOrder("o3"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(err);
  });
});
