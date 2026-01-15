import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBarOrder } from "../useBarOrder";

// All mock variables are declared up front. Vitest hoists each
// `vi.mock` call so these placeholders must exist beforehand.

/* eslint-disable no-var */
var addMock: ReturnType<typeof vi.fn>;
var removeMock: ReturnType<typeof vi.fn>;
var clearMock: ReturnType<typeof vi.fn>;
var confirmMock: ReturnType<typeof vi.fn>;
var updateMock: ReturnType<typeof vi.fn>;
var addError: unknown;
/* eslint-enable no-var */

vi.mock("../../../../data/bar/useUnconfirmedBarOrderData", () => ({
  useUnconfirmedBarOrderData: () => ({
    unconfirmedOrder: { confirmed: false, items: [] },
    loading: false,
    error: null,
  }),
}));

vi.mock("../useAddItemToOrder", () => ({
  useAddItemToOrder: () => ({ addItemToOrder: addMock, error: addError }),
}));
vi.mock("../useRemoveItemFromOrder", () => ({
  useRemoveItemFromOrder: () => ({ removeItemFromOrder: removeMock, error: null }),
}));
vi.mock("../useClearOrder", () => ({
  useClearOrder: () => ({ clearOrder: clearMock, error: null }),
}));
vi.mock("../useConfirmOrder", () => ({
  useConfirmOrder: () => ({ confirmOrder: confirmMock, error: null }),
}));
vi.mock("../useUpdateItemInOrder", () => ({
  useUpdateItemInOrder: () => ({ updateItemInOrder: updateMock, error: null }),
}));

beforeEach(() => {
  addMock = vi.fn();
  removeMock = vi.fn();
  clearMock = vi.fn();
  confirmMock = vi.fn();
  updateMock = vi.fn();
  addError = null;
});

describe("useBarOrder", () => {
  it("exposes aggregated actions", async () => {
    const { result } = renderHook(() => useBarOrder());

    await act(async () => {
      result.current.addItemToOrder("a", 1, null);
      result.current.removeItemFromOrder("a");
      result.current.clearOrder();
      result.current.confirmOrder("1", "u", "t", "cash");
      result.current.updateItemInOrder("a", "b", 2);
    });

    expect(addMock).toHaveBeenCalled();
    expect(removeMock).toHaveBeenCalled();
    expect(clearMock).toHaveBeenCalled();
    expect(confirmMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("combines error states", () => {
    addError = new Error("fail");
    const { result } = renderHook(() => useBarOrder());
    expect(result.current.error).toEqual(new Error("fail"));
  });
});
