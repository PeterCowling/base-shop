import "@testing-library/jest-dom";

import { renderHook, waitFor } from "@testing-library/react";

import { usePlacedPreorder } from "../usePlacedPreorder";

const getMock = jest.fn();
const refMock = jest.fn((..._args: unknown[]) => ({}));
const databaseMock = {};

jest.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => databaseMock,
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
}));

function snap(val: unknown) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  };
}

describe("usePlacedPreorder", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed preorder data", async () => {
    getMock.mockResolvedValueOnce(snap({ preorderTime: "10:00", items: [] }));

    const { result } = renderHook(() =>
      usePlacedPreorder("breakfast", "July", "24", "t1")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ preorderTime: "10:00", items: [] });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid preorder data", async () => {
    getMock.mockResolvedValueOnce(snap({ preorderTime: 1, items: [] }));

    const { result } = renderHook(() =>
      usePlacedPreorder("breakfast", "July", "24", "t1")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
