import "@testing-library/jest-dom";

import { act, renderHook, waitFor } from "@testing-library/react";

import useCityTax from "../../../../hooks/data/useCityTax";
import type { CityTaxRecord } from "../../../../types/hooks/data/cityTaxData";
import useCityTaxAmount from "../useCityTaxAmount";
import { useCityTaxPayment } from "../useCityTaxPayment";

jest.mock("../../../../hooks/data/useCityTax");

const useCityTaxMock = jest.mocked(useCityTax);

const makeRecord = (balance: number): CityTaxRecord => ({
  balance,
  totalDue: balance,
  totalPaid: 0,
});

beforeEach(() => {
  jest.clearAllMocks();
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
    jest.useFakeTimers();
    const fakeDate = new Date("2024-01-01T10:00:00Z");
    jest.setSystemTime(fakeDate);
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
    jest.useRealTimers();
  });
});
