import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";
import type { Ticket } from "../../../../types/bar/BarTypes";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useSalesData } from "../useSalesData";

jest.mock("../../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useSalesData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("emits loading then sales data", () => {
    const sampleTicket: Ticket = { header: { orderNum: "1" }, items: [] };

    mockedSub
      .mockReturnValueOnce({ data: null, loading: true, error: null })
      .mockReturnValueOnce({
        data: { a: sampleTicket },
        loading: false,
        error: null,
      });

    const { result, rerender } = renderHook(() => useSalesData());

    expect(result.current.loading).toBe(true);
    expect(result.current.salesData).toBeNull();

    rerender();

    expect(result.current.loading).toBe(false);
    expect(result.current.salesData).toEqual({ a: sampleTicket });
    expect(result.current.error).toBeNull();
  });

  it("emits loading then error", () => {
    mockedSub
      .mockReturnValueOnce({ data: null, loading: true, error: null })
      .mockReturnValueOnce({ data: null, loading: false, error: "fail" });

    const { result, rerender } = renderHook(() => useSalesData());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    rerender();

    expect(result.current.loading).toBe(false);
    expect(result.current.salesData).toBeNull();
    expect(result.current.error).toBe("fail");
  });
});
