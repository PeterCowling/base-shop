jest.mock("@acme/config", () => ({ env: {} }));
jest.mock("@upstash/redis", () => ({ Redis: jest.fn() }));

import { redis, attempts } from "../../src/middleware/cache";

describe("cache", () => {
  it("initializes without redis", () => {
    expect(redis).toBeNull();
    expect(attempts).toBeInstanceOf(Map);
  });
});
