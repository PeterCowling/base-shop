import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeletePreorder } from "../useDeletePreorder";

// Declare mock variables prior to `vi.mock` so they exist when the
// hoisted mock factory runs.

/* eslint-disable no-var */
var getDatabaseMock: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
var removeMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("firebase/database", () => {
  getDatabaseMock = vi.fn(() => ({}));
  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  removeMock = vi.fn();

  return {
    getDatabase: getDatabaseMock,
    ref: refMock,
    remove: removeMock,
  };
});

beforeEach(() => {
  getDatabaseMock.mockClear();
  refMock.mockClear();
  removeMock.mockClear();
});

describe("useDeletePreorder", () => {
  it("removes preorder at computed path", async () => {
    const { result } = renderHook(() => useDeletePreorder());
    await act(async () => {
      await result.current.deletePreorder("txn1", "breakfastPreorders", "June", "01");
    });

    expect(removeMock).toHaveBeenCalledWith({
      path: "barOrders/breakfastPreorders/June/01/txn1",
    });
    expect(result.current.error).toBeNull();
  });
});
