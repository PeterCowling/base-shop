import "@testing-library/jest-dom";

import type { CashCount } from "../../types/hooks/data/cashCountData";
import { findOpenShift } from "../shiftUtils";

const base: Omit<CashCount, "timestamp" | "type"> = {
  user: "tester",
};

describe("findOpenShift", () => {
  it("returns undefined for empty array", () => {
    expect(findOpenShift([])).toBeUndefined();
  });

  it("returns undefined when opening is closed", () => {
    const records: CashCount[] = [
      { ...base, type: "opening", timestamp: "2024-01-01T08:00:00Z" },
      { ...base, type: "close", timestamp: "2024-01-01T10:00:00Z" },
    ];
    expect(findOpenShift(records)).toBeUndefined();
  });

  it("returns last unmatched opening", () => {
    const open1: CashCount = { ...base, type: "opening", timestamp: "2024-01-01T08:00:00Z" };
    const close1: CashCount = { ...base, type: "close", timestamp: "2024-01-01T10:00:00Z" };
    const open2: CashCount = { ...base, type: "opening", timestamp: "2024-01-01T12:00:00Z" };
    const records: CashCount[] = [open2, close1, open1];
    expect(findOpenShift(records)).toBe(open2);
  });

  it("handles interleaved open/close events", () => {
    const records: CashCount[] = [
      { ...base, type: "opening", timestamp: "2024-01-01T08:00:00Z" },
      { ...base, type: "opening", timestamp: "2024-01-01T09:00:00Z" },
      { ...base, type: "close", timestamp: "2024-01-01T10:00:00Z" },
      { ...base, type: "opening", timestamp: "2024-01-01T11:00:00Z" },
    ];
    expect(findOpenShift(records)).toEqual(
      { ...base, type: "opening", timestamp: "2024-01-01T11:00:00Z" }
    );
  });
});
