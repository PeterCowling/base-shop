import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* eslint-disable no-var */
var mockedSub: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../useFirebaseSubscription", () => {
  mockedSub = vi.fn();
  return { default: mockedSub };
});

import useRoomStatusData from "../useRoomStatus";

describe("useRoomStatus", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns parsed room status data", () => {
    const data = { "101": { clean: "t" } };
    mockedSub.mockReturnValue({ data, loading: false, error: null });

    const { result } = renderHook(() => useRoomStatusData());

    expect(result.current.roomStatusMap).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid data", () => {
    mockedSub.mockReturnValue({ data: { "101": { invalid: true } }, loading: false, error: null });

    const { result } = renderHook(() => useRoomStatusData());

    expect(result.current.roomStatusMap).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it("propagates subscription errors", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: "boom" });

    const { result } = renderHook(() => useRoomStatusData());

    expect(result.current.roomStatusMap).toBeNull();
    expect(result.current.error).toBe("boom");
  });
});
