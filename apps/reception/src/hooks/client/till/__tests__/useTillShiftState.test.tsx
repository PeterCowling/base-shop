import "@testing-library/jest-dom";

import React from "react";
import { renderHook } from "@testing-library/react";

import { TillShiftProvider } from "../TillShiftProvider";
import { useTillShifts } from "../useTillShifts";
import { useTillShiftState } from "../useTillShiftState";

jest.mock("../useTillShifts");
const mockedUseTillShifts = jest.mocked(useTillShifts);

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
