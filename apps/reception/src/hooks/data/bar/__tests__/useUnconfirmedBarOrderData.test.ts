import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BarOrder } from "../../../../schemas/barOrderSchema";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useUnconfirmedBarOrderData } from "../useUnconfirmedBarOrderData";

vi.mock("../../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useUnconfirmedBarOrderData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed order", async () => {
    mockedSub.mockReturnValue({
      data: { confirmed: false, items: [] },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useUnconfirmedBarOrderData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unconfirmedOrder).toEqual({
      confirmed: false,
      items: [],
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid unconfirmed order data", async () => {
    mockedSub.mockReturnValue({
      data: {
        confirmed: false,
        items: [{ product: 1 }],
      } as unknown as BarOrder,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useUnconfirmedBarOrderData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unconfirmedOrder).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
