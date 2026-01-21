import "@testing-library/jest-dom";
import { renderHook, waitFor } from "@testing-library/react";
import type { BarOrder } from "../../../../schemas/barOrderSchema";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useUnconfirmedBarOrderData } from "../useUnconfirmedBarOrderData";

jest.mock("../../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useUnconfirmedBarOrderData", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
