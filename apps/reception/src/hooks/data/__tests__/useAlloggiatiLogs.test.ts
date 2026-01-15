import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useAlloggiatiLogs from "../useAlloggiatiLogs";
import useFirebaseSubscription from "../useFirebaseSubscription";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useAlloggiatiLogs", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exposes parsed logs when data valid", () => {
    mockedSub.mockReturnValue({
      data: {
        occ1: { result: "OK", timestamp: "t" },
      } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useAlloggiatiLogs("2024-06-01"));

    expect(result.current.logs).toEqual({
      occ1: { result: "OK", timestamp: "t" },
    });
    expect(result.current.error).toBeNull();
  });

  it("returns error and null logs when data invalid", () => {
    mockedSub.mockReturnValue({
      data: {
        occ1: { result: "OK", timestamp: 5 },
      } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useAlloggiatiLogs("2024-06-01"));

    expect(result.current.logs).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
