import { act, renderHook } from "@testing-library/react";

import useEmailGuest from "../useEmailGuest";

describe("useEmailGuest", () => {
  const originalFetch = global.fetch;
  /* eslint-disable no-var */
  var fetchMock: jest.Mock;
  /* eslint-enable no-var */

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as Record<string, unknown>).fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("logs and skips fetch when email is disabled", async () => {
    const logSpy = jest.spyOn(console, "log");
    const { result } = renderHook(() => useEmailGuest());

    await act(async () => {
      await result.current.sendEmailGuest("REF123");
    });

    expect(logSpy).toHaveBeenCalledWith(
      "Email sending is disabled. Simulating successful send."
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.message).toBe(
      "Email Guest Connection Successful (simulated)."
    );
    expect(result.current.loading).toBe(false);
  });

  it("calls fetch and logs success when email is enabled", async () => {
    const logSpy = jest.spyOn(console, "log");
    fetchMock.mockResolvedValue({
      text: () => Promise.resolve("OK"),
    } as Response);

    const { result } = renderHook(() => useEmailGuest({ enableEmail: true }));

    await act(async () => {
      await result.current.sendEmailGuest("REF123");
    });

    const expectedUrl =
      "https://script.google.com/macros/s/AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx/exec?bookingRef=REF123";

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    expect(logSpy).toHaveBeenCalledWith(
      "Email Guest Connection Successful:",
      "OK"
    );
    expect(result.current.message).toBe("OK");
    expect(result.current.loading).toBe(false);
  });
});
