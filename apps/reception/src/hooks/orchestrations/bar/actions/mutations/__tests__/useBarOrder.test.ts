import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import { useBarOrder } from "../useBarOrder";

// All mock variables are declared up front. Vitest hoists each
// `vi.mock` call so these placeholders must exist beforehand.

/* eslint-disable no-var */
var addMock: jest.Mock;
var removeMock: jest.Mock;
var clearMock: jest.Mock;
var confirmMock: jest.Mock;
var updateMock: jest.Mock;
var addError: unknown;
/* eslint-enable no-var */

jest.mock("../../../../data/bar/useUnconfirmedBarOrderData", () => ({
  useUnconfirmedBarOrderData: () => ({
    unconfirmedOrder: { confirmed: false, items: [] },
    loading: false,
    error: null,
  }),
}));

jest.mock("../useAddItemToOrder", () => ({
  useAddItemToOrder: () => ({ addItemToOrder: addMock, error: addError }),
}));
jest.mock("../useRemoveItemFromOrder", () => ({
  useRemoveItemFromOrder: () => ({ removeItemFromOrder: removeMock, error: null }),
}));
jest.mock("../useClearOrder", () => ({
  useClearOrder: () => ({ clearOrder: clearMock, error: null }),
}));
jest.mock("../useConfirmOrder", () => ({
  useConfirmOrder: () => ({ confirmOrder: confirmMock, error: null }),
}));
jest.mock("../useUpdateItemInOrder", () => ({
  useUpdateItemInOrder: () => ({ updateItemInOrder: updateMock, error: null }),
}));

beforeEach(() => {
  addMock = jest.fn();
  removeMock = jest.fn();
  clearMock = jest.fn();
  confirmMock = jest.fn();
  updateMock = jest.fn();
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
