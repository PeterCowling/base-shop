import { act, renderHook, waitFor } from "@testing-library/react";

import roomsData from "@/data/roomsData";
import { useRoomDetailBookingState } from "@/hooks/useRoomDetailBookingState";

jest.mock("@/hooks/useAvailabilityForRoom", () => ({
  useAvailabilityForRoom: () => ({ availabilityRoom: undefined, loading: false, error: null }),
}));

jest.mock("@/hooks/useRecoveryResumeFallback", () => ({
  useRecoveryResumeFallback: () => ({ showRebuildQuotePrompt: false }),
}));

function getTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("Room detail booking state contracts (TASK-DP)", () => {
  const room = roomsData.find((item) => item.id === "room_10") ?? roomsData[0];

  it("TC-DP-01: absent URL params seed today + 2 nights and pax=1", async () => {
    const replace = jest.fn();
    const params = new URLSearchParams();

    renderHook(() => useRoomDetailBookingState(params, replace, room, room.id));

    const todayIso = getTodayIso();
    const checkoutIso = addDays(todayIso, 2);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        expect.stringContaining(`checkin=${todayIso}`),
        expect.objectContaining({ scroll: false }),
      );
    });

    expect(replace).toHaveBeenCalledWith(expect.stringContaining(`checkout=${checkoutIso}`), expect.any(Object));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("pax=1"), expect.any(Object));
  });

  it("TC-DP-02: handleRangeChange writes checkin/checkout into router.replace", () => {
    const replace = jest.fn();
    const params = new URLSearchParams("checkin=2025-06-10&checkout=2025-06-12&pax=1");

    const { result } = renderHook(() => useRoomDetailBookingState(params, replace, room, room.id));

    act(() => {
      result.current.handleRangeChange({
        from: new Date("2025-06-15T00:00:00.000Z"),
        to: new Date("2025-06-17T00:00:00.000Z"),
      });
    });

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("checkin=2025-06-15"),
      expect.objectContaining({ scroll: false }),
    );
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("checkout=2025-06-17"), expect.any(Object));
  });

  it("TC-DP-03: invalid stay range maps to queryState=invalid", () => {
    const replace = jest.fn();
    const params = new URLSearchParams("checkin=2025-06-15&checkout=2025-06-15&pax=1");

    const { result } = renderHook(() => useRoomDetailBookingState(params, replace, room, room.id));

    expect(result.current.queryState).toBe("invalid");
  });

  it("TC-DP-04: pickerAdults initializes from params and keeps lower bound semantics", () => {
    const replace = jest.fn();
    const params = new URLSearchParams("checkin=2025-06-10&checkout=2025-06-12&pax=1");

    const { result } = renderHook(() => useRoomDetailBookingState(params, replace, room, room.id));

    expect(result.current.pickerAdults).toBe(1);
    expect(result.current.maxPickerAdults).toBeGreaterThanOrEqual(1);
  });
});
