import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import { useDeletePreorder } from "../useDeletePreorder";

// Declare mock variables prior to `vi.mock` so they exist when the
// hoisted mock factory runs.

/* eslint-disable no-var */
var getDatabaseMock: jest.Mock;
var refMock: jest.Mock;
var removeMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("firebase/database", () => {
  getDatabaseMock = jest.fn(() => ({}));
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  removeMock = jest.fn();

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
