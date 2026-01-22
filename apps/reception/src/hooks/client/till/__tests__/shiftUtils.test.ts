import "@testing-library/jest-dom";

import type { CashCount } from "../../../../types/hooks/data/cashCountData";
import { getLastClose } from "../shiftUtils";

const base: Omit<CashCount, "timestamp" | "type"> = {
  user: "tester",
};

describe("getLastClose", () => {
  it("returns undefined for empty array", () => {
    expect(getLastClose([])).toBeUndefined();
  });

  it("returns most recent close", () => {
    const c1: CashCount = {
      ...base,
      type: "close",
      timestamp: "2024-01-01T09:00:00Z",
    };
    const c2: CashCount = {
      ...base,
      type: "close",
      timestamp: "2024-01-01T11:00:00Z",
    };
    const records: CashCount[] = [
      { ...base, type: "opening", timestamp: "2024-01-01T08:00:00Z" },
      c1,
      c2,
    ];
    expect(getLastClose(records)).toBe(c2);
  });
});
