import { __clearRateLimitStoreForTests,applyRateLimitHeaders, getRequestIp, rateLimit } from "../rateLimit";

const ENV_KEYS = ["XA_TRUST_PROXY_IP_HEADERS"] as const;

const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

it("ignores proxy headers unless explicitly trusted", () => {
  delete process.env.XA_TRUST_PROXY_IP_HEADERS;
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "cf-connecting-ip": "198.51.100.7",
      "x-forwarded-for": "203.0.113.2",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("");
});

it("prefers cf-connecting-ip when proxy headers are trusted", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "cf-connecting-ip": "198.51.100.7",
      "x-forwarded-for": "203.0.113.2",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("198.51.100.7");
});

it("falls back to x-forwarded-for and strips ports", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "x-forwarded-for": "203.0.113.2:443, 203.0.113.9",
      "x-real-ip": "203.0.113.3",
    },
  });
  expect(getRequestIp(request)).toBe("203.0.113.2");
});

// C1 — Rate limit headers

describe("applyRateLimitHeaders — allowed request", () => {
  it("C1: sets X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset; no Retry-After", () => {
    const headers = new Headers();
    const resetAt = Date.now() + 60_000;
    applyRateLimitHeaders(headers, {
      allowed: true,
      limit: 10,
      remaining: 7,
      resetAt,
      retryAfter: 0,
    });

    expect(headers.get("X-RateLimit-Limit")).toBe("10");
    expect(headers.get("X-RateLimit-Remaining")).toBe("7");
    expect(headers.get("X-RateLimit-Reset")).toBe(String(Math.ceil(resetAt / 1000)));
    expect(headers.get("Retry-After")).toBeNull();
  });
});

describe("applyRateLimitHeaders — rate-limited request", () => {
  it("C1: sets Retry-After when the request is rejected", () => {
    const headers = new Headers();
    applyRateLimitHeaders(headers, {
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: Date.now() + 30_000,
      retryAfter: 30,
    });

    expect(headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(headers.get("Retry-After")).toBe("30");
  });
});

describe("rateLimit — rate exceeded", () => {
  afterEach(() => {
    __clearRateLimitStoreForTests();
  });

  it("C1: rateLimit returns allowed:false and non-zero retryAfter after max requests", () => {
    const key = "test-client:c1-limit";
    const max = 3;
    const windowMs = 60_000;

    // Exhaust the limit
    for (let i = 0; i < max; i++) {
      const result = rateLimit({ key, windowMs, max });
      expect(result.allowed).toBe(true);
    }

    // Next request should be rejected
    const rejected = rateLimit({ key, windowMs, max });
    expect(rejected.allowed).toBe(false);
    expect(rejected.remaining).toBe(0);
    expect(rejected.retryAfter).toBeGreaterThan(0);
  });
});

it("ignores malformed ip values", () => {
  process.env.XA_TRUST_PROXY_IP_HEADERS = "true";
  const request = new Request("https://xa-uploader.example/api/uploader/login", {
    headers: {
      "cf-connecting-ip": "malformed-ip",
      "x-forwarded-for": "still-bad",
    },
  });
  expect(getRequestIp(request)).toBe("");
});
