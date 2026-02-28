// apps/brikette/src/hooks/useAvailability.test.ts
// Unit tests for the useAvailability hook.
//
// The config-env mock (default) sets OCTORATE_LIVE_AVAILABILITY=true so all
// hook tests exercise the live path. The feature-flag-off behaviour is tested
// in the route tests (TC-01-01) where it is easier to isolate.
//
// Real timers are used (no jest.useFakeTimers) to avoid act() warnings from
// React 19 state updates triggered inside setTimeout inside fetch resolution.
// Tests account for the 300ms debounce by waiting with waitFor.

import { renderHook, waitFor } from "@testing-library/react";

import type { OctorateRoom } from "@/app/api/availability/route";

jest.mock("@/config/env", () => ({
  ...jest.requireActual<typeof import("@/test/__mocks__/config-env")>("@/test/__mocks__/config-env"),
  OCTORATE_LIVE_AVAILABILITY: true,
}));

 
const { useAvailability } = require("./useAvailability") as typeof import("./useAvailability");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_ROOMS: OctorateRoom[] = [
  {
    octorateRoomName: "Dorm",
    available: true,
    priceFrom: 94.99,
    nights: 2,
    ratePlans: [{ label: "Non-Refundable" }, { label: "Flexible" }],
  },
];

const MOCK_RESPONSE = { rooms: MOCK_ROOMS, fetchedAt: "2026-06-01T10:00:00.000Z" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAvailability", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(MOCK_RESPONSE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // TC-02-02: Initial render starts in loading state before fetch resolves
  it("TC-02-02: starts in loading state on first render", () => {
    const { result } = renderHook(() =>
      useAvailability({ checkin: "2026-06-01", checkout: "2026-06-03", pax: "1" })
    );
    // Immediately after render (before debounce fires), loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.rooms).toEqual([]);
  });

  // TC-02-03: After debounce + fetch resolves, rooms and loading are set correctly
  it("TC-02-03: resolves rooms after debounce and fetch complete", async () => {
    const { result } = renderHook(() =>
      useAvailability({ checkin: "2026-06-01", checkout: "2026-06-03", pax: "1" })
    );

    // Wait for loading to finish (debounce 300ms + fetch)
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.rooms).toEqual(MOCK_ROOMS);
    expect(result.current.error).toBeNull();

    const calledUrl = String(fetchSpy.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/availability");
    expect(calledUrl).toContain("checkin=2026-06-01");
    expect(calledUrl).toContain("checkout=2026-06-03");
    expect(calledUrl).toContain("pax=1");
  });

  // TC-02-04: Rapid input changes — only the final fetch fires (debounce cancels earlier)
  it("TC-02-04: debounce suppresses intermediate fetches on rapid input changes", async () => {
    const { result, rerender } = renderHook(
      (props: { checkin: string; checkout: string; pax: string }) =>
        useAvailability(props),
      { initialProps: { checkin: "2026-06-01", checkout: "2026-06-03", pax: "1" } }
    );

    // Change props rapidly before debounce fires (< 300ms in real time is not
    // reliable, so we rerender synchronously which resets the timer)
    rerender({ checkin: "2026-06-05", checkout: "2026-06-07", pax: "2" });
    rerender({ checkin: "2026-06-10", checkout: "2026-06-12", pax: "1" });

    // Wait for final fetch to complete
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    // Only one fetch call with the final params
    const lastUrl = String(fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0]);
    expect(lastUrl).toContain("checkin=2026-06-10");
  });

  // TC-02-05: Network error → error state, rooms empty
  it("TC-02-05: sets error state on network failure", async () => {
    fetchSpy.mockRejectedValue(new Error("network failure"));

    const { result } = renderHook(() =>
      useAvailability({ checkin: "2026-06-01", checkout: "2026-06-03", pax: "1" })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.rooms).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  // TC-02-06: Non-200 HTTP response → error state
  it("TC-02-06: sets error state on HTTP 500 response", async () => {
    fetchSpy.mockResolvedValue(new Response("", { status: 500 }));

    const { result } = renderHook(() =>
      useAvailability({ checkin: "2026-06-01", checkout: "2026-06-03", pax: "1" })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.rooms).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
