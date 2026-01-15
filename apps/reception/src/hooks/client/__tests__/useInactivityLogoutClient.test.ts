import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useInactivityLogout from "../useInactivityLogoutClient";

let mockUsername = "Alice";
const logoutMock = vi.fn();

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: mockUsername } }),
}));

const TIMEOUT = 1000;

describe("useInactivityLogout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockUsername = "Alice";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls logout after timeout", () => {
    renderHook(() => useInactivityLogout(true, logoutMock, TIMEOUT));

    act(() => {
      vi.advanceTimersByTime(TIMEOUT);
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("resets timer on activity events", () => {
    renderHook(() => useInactivityLogout(true, logoutMock, TIMEOUT));

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    events.forEach((evt) => {
      act(() => {
        vi.advanceTimersByTime(TIMEOUT / 2);
      });
      window.dispatchEvent(new Event(evt));
      act(() => {
        vi.advanceTimersByTime(TIMEOUT / 2 + 100);
      });
      expect(logoutMock).not.toHaveBeenCalled();
    });

    act(() => {
      vi.advanceTimersByTime(TIMEOUT);
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("does not create timer when username is Cristiana", () => {
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");
    mockUsername = "Cristiana";
    renderHook(() => useInactivityLogout(true, logoutMock, TIMEOUT));

    act(() => {
      vi.advanceTimersByTime(TIMEOUT * 2);
    });

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(logoutMock).not.toHaveBeenCalled();
  });
});
