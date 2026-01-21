import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  applyRateLimitHeaders,
  getRequestIp,
  rateLimit,
} from "../rateLimit";

beforeEach(() => {
  delete globalThis.__xaRateLimitStore;
});

afterEach(() => {
  delete globalThis.__xaRateLimitStore;
  jest.useRealTimers();
});

describe("rateLimit", () => {
  it("extracts request IP from headers", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
      },
    });
    expect(getRequestIp(request)).toBe("10.0.0.1");
  });

  it("enforces limits within a window", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    const first = rateLimit({ key: "ip:1", windowMs: 1000, max: 2 });
    const second = rateLimit({ key: "ip:1", windowMs: 1000, max: 2 });
    const third = rateLimit({ key: "ip:1", windowMs: 1000, max: 2 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfter).toBeGreaterThan(0);
  });

  it("applies rate limit headers", () => {
    const headers = new Headers();
    applyRateLimitHeaders(headers, {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 5000,
      retryAfter: 3,
    });
    expect(headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(headers.get("Retry-After")).toBe("3");
  });
});
