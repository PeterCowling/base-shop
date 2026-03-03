import { renderHook, waitFor } from "@testing-library/react";

import { useRecoveryResumeFallback } from "./useRecoveryResumeFallback";

const mockClearBookingSearch = jest.fn();
const mockClearRecoveryResumeParams = jest.fn();
const mockReadRecoveryResumeStatus = jest.fn();

jest.mock("@/utils/bookingSearch", () => ({
  clearBookingSearch: (...args: unknown[]) => mockClearBookingSearch(...args),
}));

jest.mock("@/utils/recoveryQuote", () => ({
  clearRecoveryResumeParams: (...args: unknown[]) => mockClearRecoveryResumeParams(...args),
  readRecoveryResumeStatus: (...args: unknown[]) => mockReadRecoveryResumeStatus(...args),
}));

describe("useRecoveryResumeFallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadRecoveryResumeStatus.mockReturnValue({ state: "none", expiresAtMs: null });
    mockClearRecoveryResumeParams.mockReturnValue(new URLSearchParams("rebuild_quote=1"));
  });

  it("clears booking search and rewrites query when resume link is expired", async () => {
    mockReadRecoveryResumeStatus.mockReturnValue({ state: "expired", expiresAtMs: 100 });

    const params = new URLSearchParams("checkin=2026-06-10&checkout=2026-06-12&pax=2&rq_exp_ms=100");
    const replace = jest.fn();

    renderHook(() => useRecoveryResumeFallback(params, replace));

    await waitFor(() => {
      expect(mockClearBookingSearch).toHaveBeenCalledTimes(1);
      expect(mockClearRecoveryResumeParams).toHaveBeenCalledWith(params);
      expect(replace).toHaveBeenCalledWith("?rebuild_quote=1", { scroll: false });
    });
  });

  it("does not mutate state or URL when resume status is valid", async () => {
    mockReadRecoveryResumeStatus.mockReturnValue({ state: "valid", expiresAtMs: Date.now() + 10000 });

    const params = new URLSearchParams("checkin=2026-06-10&checkout=2026-06-12&pax=2&rq_exp_ms=9999999999999");
    const replace = jest.fn();

    renderHook(() => useRecoveryResumeFallback(params, replace));

    await waitFor(() => {
      expect(mockReadRecoveryResumeStatus).toHaveBeenCalledWith(params);
    });

    expect(mockClearBookingSearch).not.toHaveBeenCalled();
    expect(mockClearRecoveryResumeParams).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("returns showRebuildQuotePrompt=true when rebuild_quote=1", () => {
    const params = new URLSearchParams("rebuild_quote=1");
    const replace = jest.fn();

    const { result } = renderHook(() => useRecoveryResumeFallback(params, replace));

    expect(result.current.showRebuildQuotePrompt).toBe(true);
  });

  it("returns showRebuildQuotePrompt=false when params are null", () => {
    const replace = jest.fn();

    const { result } = renderHook(() => useRecoveryResumeFallback(null, replace));

    expect(result.current.showRebuildQuotePrompt).toBe(false);
  });
});
