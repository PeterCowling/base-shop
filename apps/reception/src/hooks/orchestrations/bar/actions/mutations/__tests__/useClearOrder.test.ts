import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useClearOrder } from "../useClearOrder";

// Declare mocks before the `vi.mock` factory. Vitest hoists the
// call so these variables must exist when the mock executes.

/* eslint-disable no-var */
var database: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var removeMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("firebase/database", () => {
  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  getMock = vi.fn();
  removeMock = vi.fn();

  return {
    ref: refMock,
    get: getMock,
    remove: removeMock,
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
  removeMock.mockReset();
});

describe("useClearOrder", () => {
  it("removes order when node exists", async () => {
    getMock.mockResolvedValueOnce(snap({ items: [] }));
    const { result } = renderHook(() => useClearOrder());

    await act(async () => {
      await result.current.clearOrder();
    });

    expect(removeMock).toHaveBeenCalledWith({ path: "barOrders/unconfirmed" });
    expect(result.current.error).toBeNull();
  });
});
