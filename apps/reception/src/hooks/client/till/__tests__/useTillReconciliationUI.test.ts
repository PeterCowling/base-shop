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
  it("opens forms correctly via union", () => {
    const { result } = renderHook(() => useTillReconciliationUI());

    act(() => {
      result.current.handleAddChangeClick();
    });
    expect(result.current.cashForm).toBe("float");

    act(() => {
      result.current.handleExchangeClick();
    });
    expect(result.current.cashForm).toBe("exchange");

    act(() => {
      result.current.handleLiftClick();
    });
    expect(result.current.cashForm).toBe("tenderRemoval");
  });

  it("closeCashForms resets cashForm to none", () => {
    const { result } = renderHook(() => useTillReconciliationUI());

    act(() => {
      result.current.handleAddChangeClick();
    });
    expect(result.current.cashForm).toBe("float");

    act(() => {
      result.current.closeCashForms();
    });
    expect(result.current.cashForm).toBe("none");
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
