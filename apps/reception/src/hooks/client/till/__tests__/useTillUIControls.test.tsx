import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { useTillShifts } from "../useTillShifts";
import { TillShiftProvider } from "../TillShiftProvider";
import { useTillUIControls } from "../useTillUIControls";

vi.mock("../useTillShifts");
const mockedUseTillShifts = vi.mocked(useTillShifts);

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillShiftProvider>{children}</TillShiftProvider>
);

describe("useTillUIControls", () => {
  it("returns UI toggles from context", () => {
    const sample = {
      showOpenShiftForm: true,
      setShowOpenShiftForm: vi.fn(),
      showCloseShiftForm: false,
      setShowCloseShiftForm: vi.fn(),
      closeShiftFormVariant: "close" as const,
      setCloseShiftFormVariant: vi.fn(),
      showKeycardCountForm: false,
      setShowKeycardCountForm: vi.fn(),
    } as unknown as ReturnType<typeof useTillShifts>;
    mockedUseTillShifts.mockReturnValue(sample);

    const { result } = renderHook(() => useTillUIControls(), { wrapper });
    expect(result.current).toEqual(sample);
  });
});
