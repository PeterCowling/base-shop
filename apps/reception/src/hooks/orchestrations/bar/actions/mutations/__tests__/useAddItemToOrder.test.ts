import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAddItemToOrder } from "../useAddItemToOrder";

// Mocks need to be declared above the `vi.mock` call.
// Vitest hoists `vi.mock` to the top of the file, so using `var`
// ensures these variables exist when the factory runs.

/* eslint-disable no-var */
var database: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("firebase/database", () => {
  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  getMock = vi.fn();
  setMock = vi.fn();

  return {
    ref: refMock,
    get: getMock,
    set: setMock,
  };
});

vi.mock("../../../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

function snap(val: unknown) {
  return { exists: () => val !== null && val !== undefined, val: () => val };
}

beforeEach(() => {
  database = {};
  refMock.mockClear();
  getMock.mockReset();
  setMock.mockReset();
});

describe("useAddItemToOrder", () => {
  it("increments count when item already exists", async () => {
    getMock.mockResolvedValueOnce(
      snap({ confirmed: false, items: [{ product: "Beer", price: 3, count: 1, lineType: "bds" }] })
    );

    const { result } = renderHook(() =>
      useAddItemToOrder({ mapToLineType: () => "bds" })
    );

    await act(async () => {
      await result.current.addItemToOrder("Beer", 3, null);
    });

    expect(setMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" }, {
      confirmed: false,
      items: [{ product: "Beer", price: 3, count: 2, lineType: "bds" }],
    });
    expect(result.current.error).toBeNull();
  });
});
