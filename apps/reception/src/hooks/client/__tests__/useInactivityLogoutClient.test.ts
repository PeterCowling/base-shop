import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import useInactivityLogout from "../useInactivityLogoutClient";

let mockUsername = "Alice";
const logoutMock = jest.fn();

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: mockUsername } }),
}));

const TIMEOUT = 1000;

describe("useInactivityLogout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUsername = "Alice";
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

  it("does not create timer when username is Cristiana", () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    mockUsername = "Cristiana";
    renderHook(() => useInactivityLogout(true, logoutMock, TIMEOUT));

    act(() => {
      jest.advanceTimersByTime(TIMEOUT * 2);
    });

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(logoutMock).not.toHaveBeenCalled();
  });
});
