import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import { useGuestsByBookingMutation } from "../useGuestsByBookingMutation";

// Helper to create a mock fetch Response
function jsonResponse<T>(data: T, ok = true) {
  return { ok, json: async () => data } as Response;
}

describe("useGuestsByBookingMutation", () => {
  const originalFetch = global.fetch;
  /* eslint-disable no-var */
  var fetchMock: jest.Mock;
  /* eslint-enable no-var */

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("parses response when creating or updating", async () => {
    const data = { occ1: { reservationCode: "ABC" } };
    fetchMock.mockResolvedValue(jsonResponse(data));

    const { result } = renderHook(() => useGuestsByBookingMutation());

    let resultData;
    await act(async () => {
      resultData = await result.current.createOrUpdateGuest("occ1", "ABC");
    });

    expect(resultData).toEqual(data);
  });

  it("throws on schema violation for create/update", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ wrong: "data" }));
    const { result } = renderHook(() => useGuestsByBookingMutation());

    await expect(
      result.current.createOrUpdateGuest("occ2", "CODE")
    ).rejects.toThrow();
  });

  it("parses response when deleting", async () => {
    const data = { occ2: { reservationCode: "DEF" } };
    fetchMock.mockResolvedValue(jsonResponse(data));

    const { result } = renderHook(() => useGuestsByBookingMutation());

    let res;
    await act(async () => {
      res = await result.current.deleteGuest("occ2");
    });

    expect(res).toEqual(data);
  });

  it("throws on schema violation for delete", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const { result } = renderHook(() => useGuestsByBookingMutation());

    await expect(result.current.deleteGuest("occX")).rejects.toThrow();
  });
});
