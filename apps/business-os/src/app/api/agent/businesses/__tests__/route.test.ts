import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __resetAgentRateLimitForTests } from "@/lib/auth/agent-auth";

import { GET } from "../route";

const VALID_KEY = `${"A".repeat(31)}!`;

function createRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(url, { headers: { ...headers } });
}

describe("GET /api/agent/businesses", () => {
  beforeEach(() => {
    process.env.BOS_AGENT_API_KEY = VALID_KEY;
    __resetAgentRateLimitForTests();
  });

  afterEach(() => {
    delete process.env.BOS_AGENT_API_KEY;
    __resetAgentRateLimitForTests();
    jest.clearAllMocks();
  });

  it("TC-01: returns all businesses with correct shape", async () => {
    const request = createRequest(
      "http://localhost:3000/api/agent/businesses",
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("businesses");
    expect(Array.isArray(data.businesses)).toBe(true);
    expect(data.businesses.length).toBeGreaterThan(0);

    // Verify shape of first business
    const business = data.businesses[0];
    expect(business).toHaveProperty("id");
    expect(business).toHaveProperty("name");
    expect(business).toHaveProperty("description");
    expect(business).toHaveProperty("owner");
    expect(business).toHaveProperty("status");
    expect(business).toHaveProperty("created");
    expect(business).toHaveProperty("tags");
  });

  it("TC-02: filters to active businesses only when status=active", async () => {
    const request = createRequest(
      "http://localhost:3000/api/agent/businesses?status=active",
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("businesses");
    expect(Array.isArray(data.businesses)).toBe(true);

    // All returned businesses should have status "active"
    data.businesses.forEach((business: { status: string }) => {
      expect(business.status).toBe("active");
    });
  });

  it("TC-03: returns 400 for invalid status filter", async () => {
    const request = createRequest(
      "http://localhost:3000/api/agent/businesses?status=invalid",
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await GET(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toEqual({ error: "Invalid status filter" });
  });

  it("TC-04: returns 401 when auth header is missing", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const request = createRequest("http://localhost:3000/api/agent/businesses");

    const response = await GET(request);
    expect(response.status).toBe(401);

    warnSpy.mockRestore();
  });
});
