// src/components/loans/__tests__/useOccupantLoans.test.ts
/* eslint-env vitest */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------- hoist‑safe mock placeholder ---------------------------
/* eslint-disable no-var */
var useLoanDataMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */
// ------------------------------------------------------------------

vi.mock("../../../context/LoanDataContext", () => {
  useLoanDataMock = vi.fn();
  return { useLoanData: () => useLoanDataMock() };
});

import useOccupantLoans from "../useOccupantLoans";

const sampleLoans = {
  BOOK1: {
    OCC1: {
      txns: {
        T1: {
          count: 1,
          createdAt: "2024-01-01",
          depositType: "CASH",
          deposit: 10,
          item: "Umbrella",
          type: "Loan",
        },
      },
    },
  },
};

describe("useOccupantLoans", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns occupant loan data for valid ids", () => {
    useLoanDataMock.mockReturnValue({
      loans: sampleLoans,
      loading: true,
      error: "err",
    });

    const { result } = renderHook(() => useOccupantLoans("BOOK1", "OCC1"));

    expect(result.current.occupantLoans).toEqual(sampleLoans.BOOK1.OCC1);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("err");
  });

  it("clears loading and error when ids are missing", () => {
    useLoanDataMock.mockReturnValue({
      loans: sampleLoans,
      loading: true,
      error: "err",
    });

    const { result } = renderHook(() => useOccupantLoans("", ""));

    expect(result.current.occupantLoans).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
