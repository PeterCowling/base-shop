import "@testing-library/jest-dom";

import React from "react";
import { renderHook } from "@testing-library/react";

import { TillShiftProvider } from "../TillShiftProvider";
import { useTillShifts } from "../useTillShifts";
import { useTillTransactions } from "../useTillTransactions";

jest.mock("../useTillShifts");

const mockedUseTillShifts = jest.mocked(useTillShifts);

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillShiftProvider>{children}</TillShiftProvider>
);

describe("useTillTransactions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns values from useTillShifts unchanged", () => {
    const sample = {
      filteredTransactions: [{ txnId: "1", amount: 10 }],
      creditSlipTotal: 5,
      netCash: 6,
      netCC: 7,
      docDepositsCount: 1,
      docReturnsCount: 2,
      keycardsLoaned: 3,
      keycardsReturned: 4,
      ccTransactionsFromLastShift: [{ txnId: "2", amount: 8 }],
      ccTransactionsFromThisShift: [{ txnId: "3", amount: 9 }],
    } as unknown as ReturnType<typeof useTillShifts>;

    mockedUseTillShifts.mockReturnValue(sample);

    const { result } = renderHook(() => useTillTransactions(), { wrapper });
    expect(result.current).toEqual(sample);
  });
});
