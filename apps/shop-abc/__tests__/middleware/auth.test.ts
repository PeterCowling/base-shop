jest.mock("@acme/config", () => ({ env: {} }));
jest.mock("@upstash/redis", () => ({ Redis: jest.fn() }));

import {
  checkLoginRateLimit,
  __resetLoginRateLimiter,
  MAX_ATTEMPTS,
} from "../../src/middleware/auth";

describe("auth rate limiter", () => {
  afterEach(async () => {
    await __resetLoginRateLimiter();
  });

  it("blocks after max attempts", async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const res = await checkLoginRateLimit("1.1.1.1", "user");
      expect(res).toBeNull();
    }
    const blocked = await checkLoginRateLimit("1.1.1.1", "user");
    expect(blocked?.status).toBe(429);
  });
});
