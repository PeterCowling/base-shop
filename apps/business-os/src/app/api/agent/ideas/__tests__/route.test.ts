import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  allocateNextIdeaId,
  appendAuditEntry,
  getIdeaById,
  type Idea,
  listInboxIdeas,
  listWorkedIdeas,
  upsertIdea,
} from "@acme/platform-core/repositories/businessOs.server";

import { __resetAgentRateLimitForTests } from "@/lib/auth/agent-auth";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

import { GET as getIdea, PATCH as patchIdea } from "../[id]/route";
import { GET as listIdeas, POST as createIdea } from "../route";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/businessOs.server", () => {
  const actual = jest.requireActual(
    "@acme/platform-core/repositories/businessOs.server"
  );
  return {
    ...actual,
    allocateNextIdeaId: jest.fn(),
    appendAuditEntry: jest.fn(),
    getIdeaById: jest.fn(),
    listInboxIdeas: jest.fn(),
    listWorkedIdeas: jest.fn(),
    upsertIdea: jest.fn(),
  };
});

const VALID_KEY = `${"A".repeat(31)}!`;

function createRequest(
  url: string,
  init?: RequestInit,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(url, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  });
}

function computeEntityShaFor(idea: Idea): Promise<string> {
  const { fileSha, ...rest } = idea;
  return computeEntitySha(rest as Record<string, unknown>);
}

describe("/api/agent/ideas", () => {
  const db = { prepare: jest.fn() } as unknown as ReturnType<typeof getDb>;

  const baseIdea: Idea = {
    Type: "Idea",
    ID: "BRIK-OPP-0001",
    Business: "BRIK",
    Status: "raw",
    Priority: "P2",
    "Created-Date": "2026-02-02",
    Tags: ["test"],
    content: "Idea content",
    filePath: "docs/business-os/ideas/inbox/BRIK-OPP-0001.user.md",
    fileSha: "sha-idea-1",
  };

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

  it("TC-01: GET /api/agent/ideas returns list with business and priority filters", async () => {
    (listInboxIdeas as jest.Mock).mockResolvedValue([baseIdea]);

    const request = createRequest(
      "http://localhost/api/agent/ideas?business=BRIK&priority=P2",
      undefined,
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await listIdeas(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.ideas).toEqual([baseIdea]);
    expect(listInboxIdeas).toHaveBeenCalledWith(db, {
      business: "BRIK",
      priority: "P2",
    });
  });

  it("TC-02: GET /api/agent/ideas/:id returns entity with entitySha", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);

    const request = createRequest(
      "http://localhost/api/agent/ideas/BRIK-OPP-0001",
      undefined,
      { "x-agent-api-key": VALID_KEY }
    );
    const params = Promise.resolve({ id: "BRIK-OPP-0001" });

    const response = await getIdea(request, { params });
    expect(response.status).toBe(200);

    const payload = await response.json();
    const expectedSha = await computeEntityShaFor(baseIdea);
    expect(payload.entity).toEqual(baseIdea);
    expect(payload.entitySha).toBe(expectedSha);
  });

  it("TC-03: POST /api/agent/ideas creates idea and logs audit actor", async () => {
    (allocateNextIdeaId as jest.Mock).mockResolvedValue("BRIK-OPP-0002");
    (upsertIdea as jest.Mock).mockResolvedValue({ success: true, idea: baseIdea });

    const request = createRequest(
      "http://localhost/api/agent/ideas",
      {
        method: "POST",
        body: JSON.stringify({
          business: "BRIK",
          content: "New idea",
          tags: ["tag"],
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );

    const response = await createIdea(request);
    expect(response.status).toBe(201);
    const [, createdIdea] = (upsertIdea as jest.Mock).mock.calls[0];
    expect(createdIdea.Priority).toBe("P3");
    expect(appendAuditEntry).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ actor: "agent", action: "create" })
    );
  });

  it("TC-04: POST /api/agent/ideas accepts explicit priority", async () => {
    (allocateNextIdeaId as jest.Mock).mockResolvedValue("BRIK-OPP-0002");
    (upsertIdea as jest.Mock).mockResolvedValue({ success: true, idea: baseIdea });

    const request = createRequest(
      "http://localhost/api/agent/ideas",
      {
        method: "POST",
        body: JSON.stringify({
          business: "BRIK",
          content: "New idea",
          priority: "P1",
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );

    const response = await createIdea(request);
    expect(response.status).toBe(201);
    const [, createdIdea] = (upsertIdea as jest.Mock).mock.calls[0];
    expect(createdIdea.Priority).toBe("P1");
  });

  it("TC-05: POST /api/agent/ideas rejects invalid priority", async () => {
    const request = createRequest(
      "http://localhost/api/agent/ideas",
      {
        method: "POST",
        body: JSON.stringify({
          business: "BRIK",
          content: "New idea",
          priority: "PX",
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );

    const response = await createIdea(request);
    expect(response.status).toBe(400);
  });

  it("TC-06: PATCH /api/agent/ideas/:id updates location", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);
    (upsertIdea as jest.Mock).mockResolvedValue({ success: true, idea: baseIdea });

    const baseEntitySha = await computeEntityShaFor(baseIdea);

    const request = createRequest(
      "http://localhost/api/agent/ideas/BRIK-OPP-0001",
      {
        method: "PATCH",
        body: JSON.stringify({
          baseEntitySha,
          patch: { location: "worked" },
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );
    const params = Promise.resolve({ id: "BRIK-OPP-0001" });

    const response = await patchIdea(request, { params });
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.entity.filePath).toContain("ideas/worked");

    const [, , location] = (upsertIdea as jest.Mock).mock.calls[0];
    expect(location).toBe("worked");
  });

  it("TC-07: PATCH /api/agent/ideas/:id updates priority", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);
    (upsertIdea as jest.Mock).mockResolvedValue({
      success: true,
      idea: { ...baseIdea, Priority: "P1" },
    });

    const baseEntitySha = await computeEntityShaFor(baseIdea);

    const request = createRequest(
      "http://localhost/api/agent/ideas/BRIK-OPP-0001",
      {
        method: "PATCH",
        body: JSON.stringify({
          baseEntitySha,
          patch: { Priority: "P1" },
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );
    const params = Promise.resolve({ id: "BRIK-OPP-0001" });

    const response = await patchIdea(request, { params });
    expect(response.status).toBe(200);
    const [, updatedIdea] = (upsertIdea as jest.Mock).mock.calls[0];
    expect(updatedIdea.Priority).toBe("P1");
  });

  it("TC-08: PATCH returns 409 when baseEntitySha is stale", async () => {
    (getIdeaById as jest.Mock).mockResolvedValue(baseIdea);

    const request = createRequest(
      "http://localhost/api/agent/ideas/BRIK-OPP-0001",
      {
        method: "PATCH",
        body: JSON.stringify({
          baseEntitySha: "stale-sha",
          patch: { content: "Updated" },
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );
    const params = Promise.resolve({ id: "BRIK-OPP-0001" });

    const response = await patchIdea(request, { params });
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.error).toBe("CONFLICT");
    expect(payload.entity).toEqual(baseIdea);
    expect(payload.currentEntitySha).toBe(await computeEntityShaFor(baseIdea));
  });

  it("TC-09: GET /api/agent/ideas rejects invalid priority filter", async () => {
    const request = createRequest(
      "http://localhost/api/agent/ideas?priority=PX",
      undefined,
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await listIdeas(request);
    expect(response.status).toBe(400);
  });

  it("TC-10: missing auth returns 401", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const request = createRequest("http://localhost/api/agent/ideas");
    const response = await listIdeas(request);

    expect(response.status).toBe(401);
    warnSpy.mockRestore();
  });
});
