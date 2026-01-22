import "@testing-library/jest-dom";

import React from "react";
import { renderHook } from "@testing-library/react";

import type { SafeCount } from "../../types/hooks/data/safeCountData";
import { SafeDataProvider, useSafeData } from "../SafeDataContext";

const mockUseSafeLogic = jest.fn();

jest.mock("../../hooks/useSafeLogic", () => ({
  useSafeLogic: (params?: unknown) => mockUseSafeLogic(params),
}));

const baseReturn = () => ({
  safeCounts: [] as SafeCount[],
  safeBalance: 0,
  getSafeBalanceAt: jest.fn(),
  loading: false,
  error: null,
  recordDeposit: jest.fn(),
  recordWithdrawal: jest.fn(),
  recordBankDeposit: jest.fn(),
  recordBankWithdrawal: jest.fn(),
  recordPettyWithdrawal: jest.fn(),
  recordExchange: jest.fn(),
  recordOpening: jest.fn(),
  recordReset: jest.fn(),
  recordReconcile: jest.fn(),
});

describe("useSafeData", () => {
  beforeEach(() => {
    mockUseSafeLogic.mockReset();
  });

  it("throws when used outside provider", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      expect(() => renderHook(() => useSafeData())).toThrow(
        "useSafeData must be used within a SafeDataProvider"
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("provides safeCounts from useSafeLogic", () => {
    const counts: SafeCount[] = [
      { id: "1", user: "u", timestamp: "t", type: "deposit", amount: 1 },
    ];
    mockUseSafeLogic.mockReturnValue({ ...baseReturn(), safeCounts: counts });
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <SafeDataProvider>{children}</SafeDataProvider>
    );
    const { result } = renderHook(() => useSafeData(), { wrapper });
    expect(result.current.safeCounts).toEqual(counts);
  });

  it("passes params to useSafeLogic when provided", () => {
    mockUseSafeLogic.mockReturnValue(baseReturn());
    renderHook(() => useSafeData(), {
      wrapper: ({ children }) => (
        <SafeDataProvider startAt="s" endAt="e">
          {children}
        </SafeDataProvider>
      ),
    });
    expect(mockUseSafeLogic).toHaveBeenCalledWith({ startAt: "s", endAt: "e" });
  });
});
