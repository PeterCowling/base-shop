import "@testing-library/jest-dom";

import React from "react";
import { renderHook } from "@testing-library/react";

import { TillShiftProvider } from "../TillShiftProvider";
import { useTillShiftActions } from "../useTillShiftActions";
import { useTillShifts } from "../useTillShifts";

jest.mock("../useTillShifts");
const mockedUseTillShifts = jest.mocked(useTillShifts);

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillShiftProvider>{children}</TillShiftProvider>
);

describe("useTillShiftActions", () => {
  it("returns action callbacks from context", () => {
    const sample = {
      handleOpenShiftClick: jest.fn(),
      confirmShiftOpen: jest.fn(),
      handleCloseShiftClick: jest.fn(),
      confirmShiftClose: jest.fn(),
      handleKeycardCountClick: jest.fn(),
      confirmKeycardReconcile: jest.fn(),
      addKeycardsFromSafe: jest.fn(),
      returnKeycardsToSafe: jest.fn(),
    } as unknown as ReturnType<typeof useTillShifts>;
    mockedUseTillShifts.mockReturnValue(sample);

    const { result } = renderHook(() => useTillShiftActions(), { wrapper });
    expect(result.current).toEqual(sample);
  });
});
