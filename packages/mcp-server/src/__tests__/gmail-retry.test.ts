/** @jest-environment node */

import type { RetryOpts } from "../utils/gmail-retry";
import { withRetry } from "../utils/gmail-retry";

/**
 * Gmail API retry utility tests (TASK-03)
 *
 * Uses real timers with 1ms base delay for fast, reliable async testing.
 */

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Helper: create a GaxiosError-like object matching Google API error shape */
function makeApiError(status: number, message = `HTTP ${status}`): Error & { code?: number; status?: number } {
  const err = new Error(message) as Error & { code?: number; status?: number };
  err.code = status;
  err.status = status;
  return err;
}

/** Shared opts for fast tests */
const fast: RetryOpts = { baseDelay: 1 };

describe("withRetry (TASK-03)", () => {
  it("TC-05: successful first attempt — no delay, no retry", async () => {
    const fn = jest.fn().mockResolvedValue("ok");

    const result = await withRetry(fn, fast);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("TC-01: 429 response — retries and returns success on subsequent attempt", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(makeApiError(429))
      .mockResolvedValueOnce("recovered");

    const result = await withRetry(fn, fast);

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("attempt 1"),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("429"),
    );
  });

  it("TC-02: 500 response — retries with increasing delay", async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(makeApiError(500))
      .mockRejectedValueOnce(makeApiError(500))
      .mockResolvedValueOnce("recovered");

    const result = await withRetry(fn, fast);

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(console.warn).toHaveBeenCalledTimes(2);
    // First retry is attempt 1, second is attempt 2
    expect(console.warn).toHaveBeenNthCalledWith(1, expect.stringContaining("attempt 1/3"));
    expect(console.warn).toHaveBeenNthCalledWith(2, expect.stringContaining("attempt 2/3"));
  });

  it("TC-03: 401 response — immediate propagation, no retry", async () => {
    const fn = jest.fn().mockRejectedValue(makeApiError(401, "Unauthorized"));

    await expect(withRetry(fn, fast)).rejects.toThrow("Unauthorized");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("TC-03b: 403 response — immediate propagation, no retry", async () => {
    const fn = jest.fn().mockRejectedValue(makeApiError(403, "Forbidden"));

    await expect(withRetry(fn, fast)).rejects.toThrow("Forbidden");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("TC-03c: 404 response — immediate propagation, no retry", async () => {
    const fn = jest.fn().mockRejectedValue(makeApiError(404, "Not Found"));

    await expect(withRetry(fn, fast)).rejects.toThrow("Not Found");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("TC-04: all retries exhausted — throws with retry count", async () => {
    const fn = jest.fn().mockRejectedValue(makeApiError(500, "Internal Server Error"));

    await expect(withRetry(fn, { ...fast, maxRetries: 2 })).rejects.toThrow(/after 2 retries/);
    // 1 initial + 2 retries = 3 calls
    expect(fn).toHaveBeenCalledTimes(3);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it("TC-04b: exhausted error includes original message", async () => {
    const fn = jest.fn().mockRejectedValue(makeApiError(502, "Bad Gateway"));

    await expect(withRetry(fn, { ...fast, maxRetries: 1 })).rejects.toThrow(/Bad Gateway/);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries 502 and 503 status codes", async () => {
    const fn502 = jest.fn()
      .mockRejectedValueOnce(makeApiError(502))
      .mockResolvedValueOnce("ok-502");

    expect(await withRetry(fn502, fast)).toBe("ok-502");
    expect(fn502).toHaveBeenCalledTimes(2);

    const fn503 = jest.fn()
      .mockRejectedValueOnce(makeApiError(503))
      .mockResolvedValueOnce("ok-503");

    expect(await withRetry(fn503, fast)).toBe("ok-503");
    expect(fn503).toHaveBeenCalledTimes(2);
  });

  it("respects custom retryableStatusCodes", async () => {
    // 418 is not retryable by default
    const fn1 = jest.fn().mockRejectedValue(makeApiError(418, "I'm a teapot"));
    await expect(withRetry(fn1, fast)).rejects.toThrow("I'm a teapot");
    expect(fn1).toHaveBeenCalledTimes(1);

    // Now make 418 retryable
    const fn2 = jest.fn()
      .mockRejectedValueOnce(makeApiError(418))
      .mockResolvedValueOnce("teapot-ok");

    expect(await withRetry(fn2, { ...fast, retryableStatusCodes: [418] })).toBe("teapot-ok");
    expect(fn2).toHaveBeenCalledTimes(2);
  });

  it("respects custom maxRetries", async () => {
    const fn = jest.fn().mockRejectedValue(makeApiError(500));

    await expect(withRetry(fn, { ...fast, maxRetries: 5 })).rejects.toThrow(/after 5 retries/);
    // 1 initial + 5 retries = 6 calls
    expect(fn).toHaveBeenCalledTimes(6);
    expect(console.warn).toHaveBeenCalledTimes(5);
  });

  it("handles errors without status code (non-API errors) — no retry", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("Network timeout"));

    await expect(withRetry(fn, fast)).rejects.toThrow("Network timeout");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("propagates the return type correctly", async () => {
    const fn = jest.fn().mockResolvedValue({ data: [1, 2, 3] });

    const result = await withRetry(fn, fast);
    expect(result).toEqual({ data: [1, 2, 3] });
  });
});
