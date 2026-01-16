import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { useTillShifts } from "../useTillShifts";
import { TillShiftProvider } from "../TillShiftProvider";
import { useTillShiftActions } from "../useTillShiftActions";

vi.mock("../useTillShifts");
const mockedUseTillShifts = vi.mocked(useTillShifts);

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillShiftProvider>{children}</TillShiftProvider>
);

describe("useTillShiftActions", () => {
  it("returns action callbacks from context", () => {
    const sample = {
      handleOpenShiftClick: vi.fn(),
      confirmShiftOpen: vi.fn(),
      handleCloseShiftClick: vi.fn(),
      confirmShiftClose: vi.fn(),
      handleKeycardCountClick: vi.fn(),
      confirmKeycardReconcile: vi.fn(),
      addKeycardsFromSafe: vi.fn(),
      returnKeycardsToSafe: vi.fn(),
    } as unknown as ReturnType<typeof useTillShifts>;
    mockedUseTillShifts.mockReturnValue(sample);

    const { result } = renderHook(() => useTillShiftActions(), { wrapper });
    expect(result.current).toEqual(sample);
  });
});
