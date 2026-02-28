import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useInactivityLogout from "../useInactivityLogoutClient";

let mockUser = { user_name: "Alice", roles: [] as string[] };
const logoutMock = jest.fn();

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const TIMEOUT = 1000;

describe("useInactivityLogout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUser = { user_name: "Alice", roles: [] };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls logout after timeout", () => {
    renderHook(() => useInactivityLogout(true, logoutMock, TIMEOUT));

    act(() => {
      jest.advanceTimersByTime(TIMEOUT);
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
        jest.advanceTimersByTime(TIMEOUT / 2);
      });
      window.dispatchEvent(new Event(evt));
      act(() => {
        jest.advanceTimersByTime(TIMEOUT / 2 + 100);
      });
      expect(logoutMock).not.toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimersByTime(TIMEOUT);
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("does not create timer when user has admin role", () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    mockUser = { user_name: "cristiana", roles: ["admin"] };
    renderHook(() => useInactivityLogout(true, logoutMock, TIMEOUT));

    act(() => {
      jest.advanceTimersByTime(TIMEOUT * 2);
    });

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(logoutMock).not.toHaveBeenCalled();
  });
});
