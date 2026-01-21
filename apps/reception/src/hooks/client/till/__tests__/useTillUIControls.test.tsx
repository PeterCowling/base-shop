import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";
import React from "react";

import { useTillShifts } from "../useTillShifts";
import { TillShiftProvider } from "../TillShiftProvider";
import { useTillUIControls } from "../useTillUIControls";

jest.mock("../useTillShifts");
const mockedUseTillShifts = jest.mocked(useTillShifts);

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillShiftProvider>{children}</TillShiftProvider>
);

describe("useTillUIControls", () => {
  it("returns UI toggles from context", () => {
    const sample = {
      showOpenShiftForm: true,
      setShowOpenShiftForm: jest.fn(),
      showCloseShiftForm: false,
      setShowCloseShiftForm: jest.fn(),
      closeShiftFormVariant: "close" as const,
      setCloseShiftFormVariant: jest.fn(),
      showKeycardCountForm: false,
      setShowKeycardCountForm: jest.fn(),
    } as unknown as ReturnType<typeof useTillShifts>;
    mockedUseTillShifts.mockReturnValue(sample);

    const { result } = renderHook(() => useTillUIControls(), { wrapper });
    expect(result.current).toEqual(sample);
  });
});
