// src/hooks/useAvailabilityQuery.test.ts
// Unit tests for the shared useAvailabilityQuery fetch utility.
// Covers: disabled state, successful fetch, unmount before debounce,
// unmount during fetch (abort), and non-ok response error.

import { act, renderHook } from "@testing-library/react";

import { useAvailabilityQuery } from "./useAvailabilityQuery";

jest.useFakeTimers();

const DEBOUNCE_MS = 300;

const mockRoom = {
  octorateRoomName: "STD",
  octorateRoomCategory: "Standard",
  available: true,
  minPrice: 50,
  sections: [],
};

function makeFetch(response: unknown, ok = true) {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(response),
  });
}

describe("useAvailabilityQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns EMPTY_STATE immediately when disabled", () => {
    const { result } = renderHook(() =>
      useAvailabilityQuery({ checkin: "2026-06-01", checkout: "2026-06-03", pax: 2, enabled: false })
    );
    expect(result.current).toEqual({ rooms: [], loading: false, error: null });
  });

  it("fetches and returns rooms on success", async () => {
    global.fetch = makeFetch({ rooms: [mockRoom] });

    const { result } = renderHook(() =>
      useAvailabilityQuery({ checkin: "2026-06-01", checkout: "2026-06-03", pax: 2, enabled: true })
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
      await Promise.resolve();
    });

    expect(result.current.rooms).toEqual([mockRoom]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not fetch if unmounted before debounce fires", async () => {
    global.fetch = jest.fn();

    const { unmount } = renderHook(() =>
      useAvailabilityQuery({ checkin: "2026-06-01", checkout: "2026-06-03", pax: 2, enabled: true })
    );

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
      await Promise.resolve();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("aborts in-flight request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    global.fetch = jest.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal as AbortSignal;
      return new Promise(() => undefined); // never resolves
    });

    const { unmount } = renderHook(() =>
      useAvailabilityQuery({ checkin: "2026-06-01", checkout: "2026-06-03", pax: 2, enabled: true })
    );

    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
      await Promise.resolve();
    });

    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("returns error state on non-ok response", async () => {
    global.fetch = makeFetch({}, false);

    const { result } = renderHook(() =>
      useAvailabilityQuery({ checkin: "2026-06-01", checkout: "2026-06-03", pax: 2, enabled: true })
    );

    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
      await Promise.resolve();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.rooms).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
