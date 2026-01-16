import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CityTaxRecord } from "../../../../types/hooks/data/cityTaxData";
import useCityTaxAmount from "../useCityTaxAmount";
import { useCityTaxPayment } from "../useCityTaxPayment";
import useCityTax from "../../../../hooks/data/useCityTax";

vi.mock("../../../../hooks/data/useCityTax");

const useCityTaxMock = vi.mocked(useCityTax);

const makeRecord = (balance: number): CityTaxRecord => ({
  balance,
  totalDue: balance,
  totalPaid: 0,
});

beforeEach(() => {
  vi.clearAllMocks();
  useCityTaxMock.mockReturnValue({
    cityTax: { B1: { O1: makeRecord(10) } },
    loading: false,
    error: null,
  });
});

describe("useCityTaxAmount", () => {
  it("computes amount and updates when pay type changes", async () => {
    const { result } = renderHook(() => useCityTaxAmount("B1", "O1"));

    await waitFor(() => expect(result.current.amount).toBe(10));

    act(() => {
      result.current.setPayType("CC");
    });

    await waitFor(() => expect(result.current.amount).toBe(18));
  });
});

describe("useCityTaxPayment", () => {
  it("calculates updates and builds transactions", () => {
    vi.useFakeTimers();
    const fakeDate = new Date("2024-01-01T10:00:00Z");
    vi.setSystemTime(fakeDate);
    const { result } = renderHook(() => useCityTaxPayment());
    const record = makeRecord(10);

    const update = result.current.calculateCityTaxUpdate(record, 5);
    expect(update).toEqual({ newTotalPaid: 5, newBalance: 5 });

    const txn = result.current.buildCityTaxTransaction(5);
    expect(txn).toEqual({
      amount: 5,
      type: "taxPayment",
      timestamp: fakeDate.toISOString(),
    });
    vi.useRealTimers();
  });
});
