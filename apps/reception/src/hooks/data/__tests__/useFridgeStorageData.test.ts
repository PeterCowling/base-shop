import "@testing-library/jest-dom";

import { renderHook, waitFor } from "@testing-library/react";

import useFirebaseSubscription from "../useFirebaseSubscription";
import useFridgeStorageData from "../useFridgeStorageData";

jest.mock("../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useFridgeStorageData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed fridgeStorage when Firebase data is valid", async () => {
    mockedSub.mockReturnValue({
      data: { occ_1: { used: true } },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useFridgeStorageData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fridgeStorage).toEqual({ occ_1: { used: true } });
    expect(result.current.error).toBeNull();
  });

  it("returns empty object when Firebase data is absent or null", async () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: null });

    const { result } = renderHook(() => useFridgeStorageData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fridgeStorage).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it("sets error when Firebase data has invalid shape", async () => {
    mockedSub.mockReturnValue({
      data: { occ_1: { used: "definitely-not-boolean" } } as unknown as { [key: string]: { used: boolean } },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useFridgeStorageData());

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("propagates subscription error without overwriting fridgeStorage", async () => {
    const subError = new Error("Firebase offline");
    mockedSub.mockReturnValue({ data: null, loading: false, error: subError });

    const { result } = renderHook(() => useFridgeStorageData());

    await waitFor(() => expect(result.current.error).toBe(subError));
  });
});
