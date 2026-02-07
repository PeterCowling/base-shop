import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import useRoomConfigs from "../useRoomConfigs";

describe("useRoomConfigs", () => {
  it("returns the expected knownRooms list", () => {
    const { result } = renderHook(() => useRoomConfigs());
    expect(result.current.knownRooms).toEqual([
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ]);
  });

  it("getBedCount returns correct counts", () => {
    const { result } = renderHook(() => useRoomConfigs());
    const { getBedCount } = result.current;

    expect(getBedCount("3")).toBe(8);
    expect(getBedCount("4")).toBe(8);
    expect(getBedCount("6")).toBe(7);
    expect(getBedCount("9")).toBe(4);
    expect(getBedCount("8")).toBe(2);
    expect(getBedCount("7")).toBe(1);
    expect(getBedCount("99")).toBe(1);
  });

  it("getMaxGuestsPerBed handles special cases", () => {
    const { result } = renderHook(() => useRoomConfigs());
    const { getMaxGuestsPerBed } = result.current;

    expect(getMaxGuestsPerBed("7")).toBe(2);
    expect(getMaxGuestsPerBed("3")).toBe(1);
  });
});
