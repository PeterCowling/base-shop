import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import type { CityTaxRecord } from "../../../../types/hooks/data/cityTaxData";
import useComputeOutstandingCityTax from "../useComputeOutstandingCityTax";

/** Sample helper to create a CityTaxRecord */
const makeRecord = (balance: number): CityTaxRecord => ({
  balance,
  totalDue: balance,
  totalPaid: 0,
});

describe("computeOutstandingCityTax", () => {
  it("applies 1.8x surcharge for credit card payments", () => {
    const record = makeRecord(12.34);
    const { result } = renderHook(() => useComputeOutstandingCityTax());

    const value = result.current.computeOutstandingCityTax(record, "CC");

    expect(value).toBe(22.21);
  });

  it("returns raw balance for non credit-card payments", () => {
    const record = makeRecord(10);
    const { result } = renderHook(() => useComputeOutstandingCityTax());

    const value = result.current.computeOutstandingCityTax(record, "CASH");

    expect(value).toBe(10);
  });

  it("returns 0 when balance is zero or negative", () => {
    const record = makeRecord(0);
    const { result } = renderHook(() => useComputeOutstandingCityTax());

    const value = result.current.computeOutstandingCityTax(record, "CASH");

    expect(value).toBe(0);
  });

  it("returns 0 when no city tax record is provided", () => {
    const { result } = renderHook(() => useComputeOutstandingCityTax());

    const value = result.current.computeOutstandingCityTax(undefined, "CC");

    expect(value).toBe(0);
  });
});
