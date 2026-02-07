import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  allocateNextCardId,
  appendAuditEntry,
  type Card,
  getCardById,
  listCardsForBoard,
  upsertCard,
} from "@acme/platform-core/repositories/businessOs.server";

import { __resetAgentRateLimitForTests } from "@/lib/auth/agent-auth";
import { getDb } from "@/lib/d1.server";
import { computeEntitySha } from "@/lib/entity-sha";

import { GET as getCard, PATCH as patchCard } from "../[id]/route";
import { GET as listCards, POST as createCard } from "../route";

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
    appendAuditEntry: jest.fn(),
    getCardById: jest.fn(),
    listCardsForBoard: jest.fn(),
    upsertCard: jest.fn(),
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

function computeEntityShaFor(card: Card): Promise<string> {
  const { fileSha, ...rest } = card;
  return computeEntitySha(rest as Record<string, unknown>);
}

describe("/api/agent/cards", () => {
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
    fileSha: "sha-1",
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

  it("TC-01: GET /api/agent/cards returns list with filters", async () => {
    (listCardsForBoard as jest.Mock).mockResolvedValue([baseCard]);

    const request = createRequest(
      "http://localhost/api/agent/cards?business=BRIK&lane=In%20progress",
      undefined,
      { "x-agent-api-key": VALID_KEY }
    );

    const response = await listCards(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.cards).toEqual([baseCard]);
    expect(listCardsForBoard).toHaveBeenCalledWith(db, {
      business: "BRIK",
      lane: "In progress",
    });
  });

  it("TC-02: GET /api/agent/cards/:id returns entity with entitySha", async () => {
    (getCardById as jest.Mock).mockResolvedValue(baseCard);

    const request = createRequest("http://localhost/api/agent/cards/BRIK-ENG-0001", undefined, {
      "x-agent-api-key": VALID_KEY,
    });
    const params = Promise.resolve({ id: "BRIK-ENG-0001" });

    const response = await getCard(request, { params });
    expect(response.status).toBe(200);

    const payload = await response.json();
    const expectedSha = await computeEntityShaFor(baseCard);
    expect(payload.entity).toEqual(baseCard);
    expect(payload.entitySha).toBe(expectedSha);
  });

  it("TC-03: POST /api/agent/cards creates card and logs audit actor", async () => {
    (allocateNextCardId as jest.Mock).mockResolvedValue("BRIK-ENG-0002");
    (upsertCard as jest.Mock).mockResolvedValue({ success: true });

    const request = createRequest(
      "http://localhost/api/agent/cards",
      {
        method: "POST",
        body: JSON.stringify({
          business: "BRIK",
          title: "Card",
          description: "Desc",
          lane: "Inbox",
          priority: "P2",
          owner: "Pete",
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );

    const response = await createCard(request);
    expect(response.status).toBe(201);
    expect(appendAuditEntry).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ actor: "agent", action: "create" })
    );
  });

  it("TC-04: POST persists Feature-Slug field", async () => {
    (allocateNextCardId as jest.Mock).mockResolvedValue("BRIK-ENG-0003");
    (upsertCard as jest.Mock).mockResolvedValue({ success: true });

    const request = createRequest(
      "http://localhost/api/agent/cards",
      {
        method: "POST",
        body: JSON.stringify({
          business: "BRIK",
          title: "Feature card",
          description: "Desc",
          lane: "Inbox",
          priority: "P2",
          owner: "Pete",
          "Feature-Slug": "my-feature",
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );

    const response = await createCard(request);
    expect(response.status).toBe(201);

    const [, createdCard] = (upsertCard as jest.Mock).mock.calls[0];
    expect(createdCard["Feature-Slug"]).toBe("my-feature");
  });

  it("TC-05: PATCH /api/agent/cards/:id applies field-level update", async () => {
    const currentCard = { ...baseCard, Lane: "Planned" };
    (getCardById as jest.Mock).mockResolvedValue(currentCard);
    (upsertCard as jest.Mock).mockResolvedValue({ success: true });

    const baseEntitySha = await computeEntityShaFor(currentCard);

    const request = createRequest(
      "http://localhost/api/agent/cards/BRIK-ENG-0001",
      {
        method: "PATCH",
        body: JSON.stringify({
          baseEntitySha,
          patch: { Lane: "In progress" },
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );
    const params = Promise.resolve({ id: "BRIK-ENG-0001" });

    const response = await patchCard(request, { params });
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.entity.Lane).toBe("In progress");
    expect(payload.entity.Title).toBe(currentCard.Title);

    const [, updatedCard] = (upsertCard as jest.Mock).mock.calls[0];
    expect(updatedCard.Lane).toBe("In progress");
    expect(updatedCard.Title).toBe(currentCard.Title);
  });

  it("TC-06: PATCH returns 409 when baseEntitySha is stale", async () => {
    const currentCard = { ...baseCard, Lane: "Planned" };
    (getCardById as jest.Mock).mockResolvedValue(currentCard);

    const request = createRequest(
      "http://localhost/api/agent/cards/BRIK-ENG-0001",
      {
        method: "PATCH",
        body: JSON.stringify({
          baseEntitySha: "stale-sha",
          patch: { Lane: "In progress" },
        }),
      },
      {
        "content-type": "application/json",
        "x-agent-api-key": VALID_KEY,
      }
    );
    const params = Promise.resolve({ id: "BRIK-ENG-0001" });

    const response = await patchCard(request, { params });
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.error).toBe("CONFLICT");
    expect(payload.entity).toEqual(currentCard);
    expect(payload.currentEntitySha).toBe(await computeEntityShaFor(currentCard));
  });

  it("TC-07: missing auth returns 401", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const request = createRequest("http://localhost/api/agent/cards");
    const response = await listCards(request);

    expect(response.status).toBe(401);
    warnSpy.mockRestore();
  });
});
