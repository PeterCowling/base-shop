import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";


import { useRates } from "@/context/RatesContext";
import roomsData from "@/data/roomsData";
import { useRoomPricing } from "@/hooks/useRoomPricing";

const getPriceForDateMock: jest.Mock = jest.fn();

jest.mock("@/context/RatesContext", () => ({
  useRates: jest.fn(),
}));
jest.mock("@/utils/dateUtils", () => ({
  getToday: () => new Date("2025-06-15T00:00:00Z"),
}));
jest.mock("@/rooms/pricing", () => ({
  getPriceForDate: (...args: unknown[]) => getPriceForDateMock(...args),
}));

const room = roomsData[0]!;
const mockedUseRates = useRates as unknown as Mock;

describe("useRoomPricing", () => {
  beforeEach(() => {
    mockedUseRates.mockReset();
    getPriceForDateMock.mockReset();
    mockedUseRates.mockReturnValue({
      rates: { "2025-06-15": 120 },
      loading: false,
      error: undefined,
    });
  });

  it("propagates the loading state from RatesContext", () => {
    getPriceForDateMock.mockReturnValue(undefined);
    mockedUseRates.mockReturnValue({
      rates: null,
      loading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useRoomPricing(room));
    expect(result.current.loading).toBe(true);
    expect(result.current.lowestPrice).toBeUndefined();
    expect(result.current.soldOut).toBe(false);
  });

  it("returns the live rate when a price exists for today", () => {
    getPriceForDateMock.mockReturnValue(155.5);

    const { result } = renderHook(() => useRoomPricing(room));

    expect(getPriceForDateMock).toHaveBeenCalledWith(room, new Date("2025-06-15T00:00:00Z"), {
      "2025-06-15": 120,
    });
    expect(result.current.lowestPrice).toBe(155.5);
    expect(result.current.soldOut).toBe(false);
  });

  it("falls back to the base price once rates finish loading without a live price", () => {
    getPriceForDateMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useRoomPricing(room));

    expect(result.current.lowestPrice).toBe(room.basePrice?.amount);
    expect(result.current.soldOut).toBe(true);
  });

  it("treats rooms without a base price as unavailable when no rate is returned", () => {
    getPriceForDateMock.mockReturnValue(undefined);
    const roomWithoutBasePrice = { ...room, basePrice: undefined } as typeof room;

    const { result } = renderHook(() => useRoomPricing(roomWithoutBasePrice));

    expect(result.current.lowestPrice).toBeUndefined();
    expect(result.current.soldOut).toBe(true);
  });

  it("surfaces errors reported by the rates context", () => {
    const error = new Error("Failed to load rates");
    getPriceForDateMock.mockReturnValue(undefined);
    mockedUseRates.mockReturnValue({
      rates: null,
      loading: false,
      error,
    });

    const { result } = renderHook(() => useRoomPricing(room));

    expect(result.current.error).toBe(error);
  });
});