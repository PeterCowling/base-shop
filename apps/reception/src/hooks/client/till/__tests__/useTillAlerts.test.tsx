import "@testing-library/jest-dom";

import React from "react";
import { renderHook } from "@testing-library/react";

import { TillShiftProvider } from "../TillShiftProvider";
import { useTillAlerts } from "../useTillAlerts";

jest.mock("../useTillShifts", () => ({
  useTillShifts: () => ({
    isDrawerOverLimit: true,
    isTillOverMax: false,
    pinRequiredForTenderRemoval: true,
  }),
}));

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillShiftProvider>{children}</TillShiftProvider>
);

describe("useTillAlerts", () => {
  it("returns selected alert flags from useTillShifts", () => {
    const { result } = renderHook(() => useTillAlerts(), { wrapper });

    expect(result.current.isDrawerOverLimit).toBe(true);
    expect(result.current.isTillOverMax).toBe(false);
    expect(result.current.pinRequiredForTenderRemoval).toBe(true);
  });
});
