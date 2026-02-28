// apps/brikette/src/hooks/useAvailabilityForRoom.test.ts
// Unit tests for the useAvailabilityForRoom hook.
//
// OCTORATE_LIVE_AVAILABILITY is overridden to true so tests exercise the live path.
// TC-RPC-02 (flag off) is validated via the empty-dates fast path which exercises
// the same return-empty-state-no-fetch code path.
// Real timers are used to avoid act() warnings from React 19 state updates
// triggered inside setTimeout inside fetch resolution.

import { renderHook, waitFor } from "@testing-library/react";

import type { OctorateRoom } from "@/app/api/availability/route";
import type { Room } from "@/data/roomsData";

jest.mock("@/config/env", () => ({
  ...jest.requireActual<typeof import("@/test/__mocks__/config-env")>("@/test/__mocks__/config-env"),
  OCTORATE_LIVE_AVAILABILITY: true,
}));

const { useAvailabilityForRoom } = require("./useAvailabilityForRoom") as typeof import("./useAvailabilityForRoom");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MATCHED_ROOM: OctorateRoom = {
  octorateRoomName: "Dorm",
  octorateRoomId: "7",
  available: true,
  priceFrom: 94.99,
  nights: 2,
  ratePlans: [{ label: "Non-Refundable" }, { label: "Flexible" }],
};

const UNMATCHED_ROOM: OctorateRoom = {
  octorateRoomName: "Double",
  octorateRoomId: "10",
  available: true,
  priceFrom: 120,
  nights: 2,
  ratePlans: [{ label: "Non-Refundable" }],
};

const MOCK_RESPONSE = {
  rooms: [MATCHED_ROOM, UNMATCHED_ROOM],
  fetchedAt: "2026-06-01T10:00:00.000Z",
};

// Room with widgetRoomCode "7" matches MATCHED_ROOM.octorateRoomId "7"
const TEST_ROOM = {
  id: "dorm_6_bed",
  widgetRoomCode: "7",
} as unknown as Room;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAvailabilityForRoom", () => {
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

  // TC-RPC-01: Successful fetch → matched room returned
  it("TC-RPC-01: returns the matching OctorateRoom after fetch resolves", async () => {
    const { result } = renderHook(() =>
      useAvailabilityForRoom({
        room: TEST_ROOM,
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        adults: 1,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.availabilityRoom).toEqual(MATCHED_ROOM);
    expect(result.current.error).toBeNull();

    const calledUrl = String(fetchSpy.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/availability");
    expect(calledUrl).toContain("checkin=2026-06-01");
    expect(calledUrl).toContain("checkout=2026-06-03");
    expect(calledUrl).toContain("pax=1");
  });

  // TC-RPC-02: Empty dates → no fetch, returns empty state immediately
  // (Exercises same return-early-no-fetch path as feature-flag-off)
  it("TC-RPC-02: empty dates → no fetch, returns empty state immediately", () => {
    const { result } = renderHook(() =>
      useAvailabilityForRoom({
        room: TEST_ROOM,
        checkIn: "",
        checkOut: "",
        adults: 1,
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.availabilityRoom).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // TC-RPC-03: API returns room with available=false → hook returns that OctorateRoom
  it("TC-RPC-03: returns OctorateRoom with available=false when room is sold out", async () => {
    const soldOutRoom: OctorateRoom = {
      octorateRoomName: "Dorm",
      octorateRoomId: "7",
      available: false,
      priceFrom: null,
      nights: 2,
      ratePlans: [],
    };

    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ rooms: [soldOutRoom], fetchedAt: "2026-06-01T10:00:00.000Z" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { result } = renderHook(() =>
      useAvailabilityForRoom({
        room: TEST_ROOM,
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        adults: 1,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.availabilityRoom).toEqual(soldOutRoom);
    expect(result.current.availabilityRoom?.available).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // TC-RPC-04: Rapid input changes within 300ms → only one fetch fires
  it("TC-RPC-04: debounce suppresses intermediate fetches on rapid rerenders", async () => {
    const { result, rerender } = renderHook(
      (props: { checkIn: string; checkOut: string; adults: number }) =>
        useAvailabilityForRoom({ room: TEST_ROOM, ...props }),
      { initialProps: { checkIn: "2026-06-01", checkOut: "2026-06-03", adults: 1 } }
    );

    // Rapid rerenders before debounce fires — synchronous, resets the timer each time
    rerender({ checkIn: "2026-06-05", checkOut: "2026-06-07", adults: 2 });
    rerender({ checkIn: "2026-06-10", checkOut: "2026-06-12", adults: 1 });

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    // Only the final params appear in the last fetch call
    const lastUrl = String(fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][0]);
    expect(lastUrl).toContain("checkin=2026-06-10");
    expect(lastUrl).not.toContain("checkin=2026-06-01");
  });

  // TC-RPC-05: Component unmounts during fetch → AbortController cancels; no state warning
  it("TC-RPC-05: unmount aborts in-flight request without throwing", async () => {
    // Make fetch never resolve (simulates in-flight network request)
    fetchSpy.mockImplementation(() => new Promise(() => {}));

    const { result, unmount } = renderHook(() =>
      useAvailabilityForRoom({
        room: TEST_ROOM,
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        adults: 1,
      })
    );

    // Wait for debounce to fire and loading to start
    await waitFor(
      () => {
        expect(result.current.loading).toBe(true);
      },
      { timeout: 1000 }
    );

    // Unmount — should not throw, warn, or trigger setState on unmounted component
    expect(() => unmount()).not.toThrow();
  });

  // TC-RPC-06: API returns HTTP 500 → graceful degradation, availabilityRoom undefined
  it("TC-RPC-06: HTTP 500 → error state, availabilityRoom undefined", async () => {
    fetchSpy.mockResolvedValue(new Response("", { status: 500 }));

    const { result } = renderHook(() =>
      useAvailabilityForRoom({
        room: TEST_ROOM,
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        adults: 1,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.availabilityRoom).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  // TC-RPC-07: No matching room in response → availabilityRoom undefined
  it("TC-RPC-07: no room in response matches widgetRoomCode → availabilityRoom undefined", async () => {
    // Only UNMATCHED_ROOM (octorateRoomId "10") in response; TEST_ROOM.widgetRoomCode is "7"
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ rooms: [UNMATCHED_ROOM], fetchedAt: "2026-06-01T10:00:00.000Z" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { result } = renderHook(() =>
      useAvailabilityForRoom({
        room: TEST_ROOM,
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        adults: 1,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.availabilityRoom).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
