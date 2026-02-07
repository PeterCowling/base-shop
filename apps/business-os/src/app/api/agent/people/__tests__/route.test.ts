import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __resetAgentRateLimitForTests } from "@/lib/auth/agent-auth";

import { GET } from "../route";

const VALID_KEY = `${"A".repeat(31)}!`;

function createRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(url, { headers: { ...headers } });
}

describe("GET /api/agent/people", () => {
  beforeEach(() => {
    process.env.BOS_AGENT_API_KEY = VALID_KEY;
    __resetAgentRateLimitForTests();
  });

  afterEach(() => {
    delete process.env.BOS_AGENT_API_KEY;
    __resetAgentRateLimitForTests();
    jest.clearAllMocks();
  });

  it("TC-01: returns all people with correct shape", async () => {
    const req = createRequest("http://localhost:3000/api/agent/people", {
      "x-agent-api-key": VALID_KEY,
    });

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = (await response.json()) as { people: unknown[] };
    expect(data).toHaveProperty("people");
    expect(Array.isArray(data.people)).toBe(true);
    expect(data.people).toHaveLength(3);

    // Verify each person has capacity with maxActiveWip
    for (const person of data.people) {
      expect(person).toHaveProperty("capacity");
      expect((person as { capacity: { maxActiveWip: number } }).capacity).toHaveProperty(
        "maxActiveWip"
      );
      expect(
        typeof (person as { capacity: { maxActiveWip: number } }).capacity.maxActiveWip
      ).toBe("number");
    }
  });

  it("TC-02: each person has required fields with correct shape", async () => {
    const req = createRequest("http://localhost:3000/api/agent/people", {
      "x-agent-api-key": VALID_KEY,
    });

    const response = await GET(req);
    const data = (await response.json()) as {
      people: Array<{
        id: string;
        name: string;
        role: string;
        capacity: { maxActiveWip: number };
        skills?: string[];
        focusAreas?: string[];
      }>;
    };

    const pete = data.people.find((p) => p.id === "pete");
    expect(pete).toBeDefined();
    expect(pete).toEqual({
      id: "pete",
      name: "Pete",
      role: "admin",
      capacity: {
        maxActiveWip: 3,
      },
    });

    // Verify optional fields are allowed (may not be present in phase 0)
    expect(pete).toHaveProperty("id");
    expect(pete).toHaveProperty("name");
    expect(pete).toHaveProperty("role");
    expect(pete).toHaveProperty("capacity");
  });

  it("TC-03: missing auth header returns 401", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const req = createRequest("http://localhost:3000/api/agent/people");

    const response = await GET(req);
    expect(response.status).toBe(401);

    consoleWarnSpy.mockRestore();
  });
});
