import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  allocateNextCardId,
  allocateNextIdeaId,
} from "@acme/platform-core/repositories/businessOs.server";

import { __resetAgentRateLimitForTests } from "@/lib/auth/agent-auth";
import { getDb } from "@/lib/d1.server";

import { POST } from "../route";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/businessOs.server", () => {
  const actual = jest.requireActual(
    "@acme/platform-core/repositories/businessOs.server"
  );
  return {
    ...actual,
    allocateNextCardId: jest.fn(),
    allocateNextIdeaId: jest.fn(),
  };
});

const VALID_KEY = `${"A".repeat(31)}!`;

function createRequest(body: unknown, apiKey?: string): NextRequest {
  const headers = {
    "content-type": "application/json",
    ...(apiKey ? { "x-agent-api-key": apiKey } : {}),
  };
  return new NextRequest("http://localhost/api/agent/allocate-id", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/allocate-id", () => {
  const db = { prepare: jest.fn() } as unknown as ReturnType<typeof getDb>;

  beforeEach(() => {
    process.env.BOS_AGENT_API_KEY = VALID_KEY;
    __resetAgentRateLimitForTests();
    (getDb as jest.Mock).mockReturnValue(db);
  });

  afterEach(() => {
    delete process.env.BOS_AGENT_API_KEY;
    __resetAgentRateLimitForTests();
    jest.clearAllMocks();
  });

  it("TC-01: POST with type=card allocates card ID", async () => {
    (allocateNextCardId as jest.Mock).mockResolvedValue("BRIK-ENG-0001");

    const response = await POST(
      createRequest({ business: "BRIK", type: "card" }, VALID_KEY)
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.id).toBe("BRIK-ENG-0001");
    expect(allocateNextCardId).toHaveBeenCalledWith(db, "BRIK");
  });

  it("TC-02: POST with type=idea allocates idea ID", async () => {
    (allocateNextIdeaId as jest.Mock).mockResolvedValue("BRIK-OPP-0001");

    const response = await POST(
      createRequest({ business: "BRIK", type: "idea" }, VALID_KEY)
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.id).toBe("BRIK-OPP-0001");
    expect(allocateNextIdeaId).toHaveBeenCalledWith(db, "BRIK");
  });

  it("TC-03: sequential allocations return monotonic IDs", async () => {
    (allocateNextCardId as jest.Mock)
      .mockResolvedValueOnce("BRIK-ENG-0001")
      .mockResolvedValueOnce("BRIK-ENG-0002");

    const first = await POST(
      createRequest({ business: "BRIK", type: "card" }, VALID_KEY)
    );
    const second = await POST(
      createRequest({ business: "BRIK", type: "card" }, VALID_KEY)
    );

    const firstPayload = await first.json();
    const secondPayload = await second.json();

    expect(firstPayload.id).not.toBe(secondPayload.id);
    expect(secondPayload.id > firstPayload.id).toBe(true);
  });

  it("TC-04: missing auth returns 401", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await POST(createRequest({ business: "BRIK", type: "card" }));

    expect(response.status).toBe(401);
    warnSpy.mockRestore();
  });
});
