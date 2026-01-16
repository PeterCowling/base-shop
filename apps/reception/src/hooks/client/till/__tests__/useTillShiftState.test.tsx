import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { useTillShifts } from "../useTillShifts";
import { TillShiftProvider } from "../TillShiftProvider";
import { useTillShiftState } from "../useTillShiftState";

vi.mock("../useTillShifts");
const mockedUseTillShifts = vi.mocked(useTillShifts);

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillShiftProvider>{children}</TillShiftProvider>
);

describe("useTillShiftState", () => {
  it("returns shift state from context", () => {
    const sample = {
      shiftOpenTime: new Date(),
      shiftOwner: "u",
      previousShiftCloseTime: new Date(),
      openingCash: 1,
      openingKeycards: 2,
      finalCashCount: 3,
      finalKeycardCount: 4,
      lastCloseCashCount: 5,
    } as unknown as ReturnType<typeof useTillShifts>;
    mockedUseTillShifts.mockReturnValue(sample);

    const { result } = renderHook(() => useTillShiftState(), { wrapper });
    expect(result.current).toEqual(sample);
  });
});
