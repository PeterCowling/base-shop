import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import type { Transaction } from "../../../../types/component/Till";
import { useCashDrawerLimit } from "../../../data/useCashDrawerLimit";
import { useTillReconciliationUI } from "../useTillReconciliationUI";

jest.mock("../../../data/useCashDrawerLimit");

const mockedDrawerLimit = jest.mocked(useCashDrawerLimit);

beforeEach(() => {
  mockedDrawerLimit.mockReturnValue({
    limit: 50,
    loading: false,
    error: undefined,
    updateLimit: jest.fn(),
  });
});

describe("useTillReconciliationUI", () => {
  it("opens forms correctly", () => {
    const { result } = renderHook(() => useTillReconciliationUI());

    act(() => {
      result.current.handleAddChangeClick();
    });
    expect(result.current.showFloatForm).toBe(true);

    act(() => {
      result.current.handleExchangeClick();
    });
    expect(result.current.showExchangeForm).toBe(true);

    act(() => {
      result.current.handleLiftClick();
    });
    expect(result.current.showTenderRemovalForm).toBe(true);
  });

  it("stores transactions for edit/delete", () => {
    const txn: Transaction = { txnId: "1", amount: 0 };
    const { result } = renderHook(() => useTillReconciliationUI());

    act(() => {
      result.current.handleRowClickForDelete(txn);
    });
    expect(result.current.txnToDelete).toBe(txn);

    act(() => {
      result.current.handleRowClickForEdit(txn);
    });
    expect(result.current.txnToEdit).toBe(txn);
  });
});
