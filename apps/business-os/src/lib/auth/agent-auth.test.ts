import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  __resetAgentRateLimitForTests,
  requireAgentAuth,
} from "./agent-auth";

const VALID_KEY = `${"A".repeat(31)}!`;

function createRequest(apiKey?: string): NextRequest {
  const headers = apiKey ? { "x-agent-api-key": apiKey } : undefined;
  return new NextRequest("http://localhost/api/agent/cards", { headers });
}

describe("requireAgentAuth", () => {
  let originalCrypto: Crypto | undefined;

  beforeEach(() => {
    process.env.BOS_AGENT_API_KEY = VALID_KEY;
    __resetAgentRateLimitForTests();
  });

  afterEach(() => {
    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    }
    __resetAgentRateLimitForTests();
    delete process.env.BOS_AGENT_API_KEY;
    jest.useRealTimers();
  });

  it("TC-01: valid API key allows request to proceed", async () => {
    const result = await requireAgentAuth(createRequest(VALID_KEY));

    expect(result).toEqual({ actor: "agent" });
  });

  it("TC-02: missing API key returns 401 without key leakage", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await requireAgentAuth(createRequest());

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) return;

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain(VALID_KEY);
    warnSpy.mockRestore();
  });

  it("TC-03: invalid API key returns 401 without key leakage", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await requireAgentAuth(createRequest("invalid-key"));

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) return;

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("invalid-key");
    warnSpy.mockRestore();
  });

  it("TC-04: uses timingSafeEqual for comparison", async () => {
    originalCrypto = globalThis.crypto as Crypto | undefined;
    const timingSafeEqual = jest.fn(() => true);
    Object.defineProperty(globalThis, "crypto", {
      value: { subtle: { timingSafeEqual } },
      configurable: true,
    });

    const result = await requireAgentAuth(createRequest(VALID_KEY));

    expect(result).toEqual({ actor: "agent" });
    expect(timingSafeEqual).toHaveBeenCalled();
  });

  it("TC-05: rate limiting blocks after 100 requests per minute", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-02T00:00:00Z"));

    for (let index = 0; index < 100; index += 1) {
      const result = await requireAgentAuth(createRequest(VALID_KEY));
      expect(result).toEqual({ actor: "agent" });
    }

    const response = await requireAgentAuth(createRequest(VALID_KEY));

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) return;

    expect(response.status).toBe(429);
    warnSpy.mockRestore();
  });
});
