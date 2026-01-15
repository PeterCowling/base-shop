import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SafeCount } from "../../types/hooks/data/safeCountData";

const mockUseSafeLogic = vi.fn();

vi.mock("../../hooks/useSafeLogic", () => ({
  useSafeLogic: (params?: unknown) => mockUseSafeLogic(params),
}));

import { SafeDataProvider, useSafeData } from "../SafeDataContext";

const baseReturn = () => ({
  safeCounts: [] as SafeCount[],
  safeBalance: 0,
  getSafeBalanceAt: vi.fn(),
  loading: false,
  error: null,
  recordDeposit: vi.fn(),
  recordWithdrawal: vi.fn(),
  recordBankDeposit: vi.fn(),
  recordBankWithdrawal: vi.fn(),
  recordPettyWithdrawal: vi.fn(),
  recordExchange: vi.fn(),
  recordOpening: vi.fn(),
  recordReset: vi.fn(),
  recordReconcile: vi.fn(),
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
