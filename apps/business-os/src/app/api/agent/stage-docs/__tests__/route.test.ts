import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  appendAuditEntry,
  type Card,
  getCardById,
  getLatestStageDoc,
  listStageDocsForCard,
  type StageDoc,
  StageTypeSchema,
  upsertStageDoc,
} from "@acme/platform-core/repositories/businessOs.server";

import { __resetAgentRateLimitForTests } from "@/lib/auth/agent-auth";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

import { GET as getStageDoc, PATCH as patchStageDoc } from "../[cardId]/[stage]/route";
import { GET as listStageDocs, POST as createStageDoc } from "../route";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/businessOs.server", () => {
  const actual = jest.requireActual(
    "@acme/platform-core/repositories/businessOs.server"
  );
  return {
    ...actual,
    appendAuditEntry: jest.fn(),
    getCardById: jest.fn(),
    getLatestStageDoc: jest.fn(),
    listStageDocsForCard: jest.fn(),
    upsertStageDoc: jest.fn(),
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

function computeEntityShaFor(stageDoc: StageDoc): Promise<string> {
  const { fileSha, ...rest } = stageDoc;
  return computeEntitySha(rest as Record<string, unknown>);
}

describe("/api/agent/stage-docs", () => {
  const db = { prepare: jest.fn() } as unknown as ReturnType<typeof getDb>;

  const baseCard: Card = {
    Type: "Card",
    ID: "BRIK-ENG-0001",
    Lane: "Inbox",
    Priority: "P2",
    Owner: "Pete",
    Business: "BRIK",
    Title: "Test card",
    content: "# Test card\n\nDescription",
    filePath: "docs/business-os/cards/BRIK-ENG-0001.user.md",
    fileSha: "sha-card-1",
  };

  const baseStageDoc: StageDoc = {
    Type: "Stage",
    Stage: "fact-find",
    "Card-ID": "BRIK-ENG-0001",
    Created: "2026-02-02",
    content: "Fact-find content",
    filePath: "docs/business-os/cards/BRIK-ENG-0001/fact-find.user.md",
    fileSha: "sha-stage-1",
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

  it("TC-01: GET /api/agent/stage-docs returns list with cardId filter", async () => {
    (listStageDocsForCard as jest.Mock).mockResolvedValue([baseStageDoc]);

    const request = createRequest(
      "http://localhost/api/agent/stage-docs?cardId=BRIK-ENG-0001",
      undefined,
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await listStageDocs(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.stageDocs).toEqual([baseStageDoc]);
    expect(listStageDocsForCard).toHaveBeenCalledWith(db, "BRIK-ENG-0001", undefined);
  });

  it("TC-02: GET /api/agent/stage-docs/:cardId/:stage returns entity with entitySha", async () => {
    (getLatestStageDoc as jest.Mock).mockResolvedValue(baseStageDoc);

    const request = createRequest(
      "http://localhost/api/agent/stage-docs/BRIK-ENG-0001/fact-find",
      undefined,
      { "x-agent-api-key": VALID_KEY }
    );
    const params = Promise.resolve({ cardId: "BRIK-ENG-0001", stage: "fact-find" });

    const response = await getStageDoc(request, { params });
    expect(response.status).toBe(200);

    const payload = await response.json();
    const expectedSha = await computeEntityShaFor(baseStageDoc);
    expect(payload.entity).toEqual(baseStageDoc);
    expect(payload.entitySha).toBe(expectedSha);
  });

  it("TC-03: POST /api/agent/stage-docs creates stage doc with parent validation", async () => {
    (getCardById as jest.Mock).mockResolvedValue(baseCard);
    (upsertStageDoc as jest.Mock).mockResolvedValue({ success: true, stageDoc: baseStageDoc });

    const request = createRequest(
      "http://localhost/api/agent/stage-docs",
      {
        method: "POST",
        body: JSON.stringify({
          cardId: "BRIK-ENG-0001",
          stage: "fact-find",
          content: "Fact-find content",
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );

    const response = await createStageDoc(request);
    expect(response.status).toBe(201);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ actor: "agent", action: "create" })
    );
  });

  it("TC-04: POST with non-existent card returns 400", async () => {
    (getCardById as jest.Mock).mockResolvedValue(null);

    const request = createRequest(
      "http://localhost/api/agent/stage-docs",
      {
        method: "POST",
        body: JSON.stringify({
          cardId: "BRIK-ENG-9999",
          stage: "fact-find",
          content: "Fact-find content",
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );

    const response = await createStageDoc(request);
    expect(response.status).toBe(400);
    expect(upsertStageDoc).not.toHaveBeenCalled();
  });

  it("TC-05: PATCH /api/agent/stage-docs/:cardId/:stage updates content", async () => {
    (getLatestStageDoc as jest.Mock).mockResolvedValue(baseStageDoc);
    (upsertStageDoc as jest.Mock).mockResolvedValue({ success: true, stageDoc: baseStageDoc });

    const baseEntitySha = await computeEntityShaFor(baseStageDoc);

    const request = createRequest(
      "http://localhost/api/agent/stage-docs/BRIK-ENG-0001/fact-find",
      {
        method: "PATCH",
        body: JSON.stringify({
          baseEntitySha,
          patch: { content: "Updated content" },
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );
    const params = Promise.resolve({ cardId: "BRIK-ENG-0001", stage: "fact-find" });

    const response = await patchStageDoc(request, { params });
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.entity.content).toBe("Updated content");

    const [, updatedStageDoc] = (upsertStageDoc as jest.Mock).mock.calls[0];
    expect(updatedStageDoc.content).toBe("Updated content");
  });

  it("TC-06: PATCH returns 409 when baseEntitySha is stale", async () => {
    (getLatestStageDoc as jest.Mock).mockResolvedValue(baseStageDoc);

    const request = createRequest(
      "http://localhost/api/agent/stage-docs/BRIK-ENG-0001/fact-find",
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
    const params = Promise.resolve({ cardId: "BRIK-ENG-0001", stage: "fact-find" });

    const response = await patchStageDoc(request, { params });
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.error).toBe("CONFLICT");
    expect(payload.entity).toEqual(baseStageDoc);
    expect(payload.currentEntitySha).toBe(await computeEntityShaFor(baseStageDoc));
  });

  it("TC-07: missing auth returns 401", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const request = createRequest("http://localhost/api/agent/stage-docs?cardId=BRIK-ENG-0001");
    const response = await listStageDocs(request);

    expect(response.status).toBe(401);
    warnSpy.mockRestore();
  });

  it("TC-08: GET /api/agent/stage-docs supports stage filter", async () => {
    (listStageDocsForCard as jest.Mock).mockResolvedValue([baseStageDoc]);

    const request = createRequest(
      "http://localhost/api/agent/stage-docs?cardId=BRIK-ENG-0001&stage=fact-find",
      undefined,
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await listStageDocs(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.stageDocs).toEqual([baseStageDoc]);
    expect(listStageDocsForCard).toHaveBeenCalledWith(
      db,
      "BRIK-ENG-0001",
      StageTypeSchema.parse("fact-find")
    );
  });
});
