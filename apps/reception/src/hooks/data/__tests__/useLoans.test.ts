import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import useLoans from "../useLoans";

/* eslint-disable no-var */
var mockUseLoanData: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../context/LoanDataContext", () => {
  mockUseLoanData = jest.fn();
  return { useLoanData: mockUseLoanData };
});

describe("useLoans", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns loans from context", () => {
    const loans = { b1: { o1: { txns: { t1: { count: 1, createdAt: "now", depositType: "CASH", deposit: 10, item: "Umbrella", type: "Loan" } } } } };
    mockUseLoanData.mockReturnValue({ loans, loading: false, error: null });

    const { result } = renderHook(() => useLoans());

    expect(result.current.loans).toBe(loans);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("exposes loading and error states", () => {
    mockUseLoanData.mockReturnValue({ loans: null, loading: true, error: "fail" });

    const { result } = renderHook(() => useLoans());

    expect(result.current.loans).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("fail");
  });
});
