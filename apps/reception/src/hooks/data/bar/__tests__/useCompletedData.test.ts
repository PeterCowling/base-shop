import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Ticket } from "../../../../types/bar/BarTypes";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useCompletedData } from "../useCompletedData";

vi.mock("../../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useCompletedData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns completed data", () => {
    const ticket: Ticket = { header: { orderNum: "1" }, items: [] };
    mockedSub.mockReturnValue({
      data: { a: ticket },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useCompletedData());

    expect(result.current.completedData).toEqual({ a: ticket });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns null when no data", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: null });

    const { result } = renderHook(() => useCompletedData());

    expect(result.current.completedData).toBeNull();
  });

  it("forwards subscription error", () => {
    const err = new Error("fail");
    mockedSub.mockReturnValue({ data: null, loading: false, error: err });

    const { result } = renderHook(() => useCompletedData());

    expect(result.current.error).toBe(err);
  });
});
