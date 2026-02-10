import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  type Card,
  getCardById,
  getIdeaById,
  getLatestStageDoc,
  type Idea,
  listCardsForBoard,
  listInboxIdeas,
  listWorkedIdeas,
  type StageDoc,
} from "@acme/platform-core/repositories/businessOs.server";

import { getDb } from "@/lib/d1.server";

import { GET } from "../route";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/businessOs.server", () => {
  const actual = jest.requireActual(
    "@acme/platform-core/repositories/businessOs.server"
  );
  return {
    ...actual,
    getCardById: jest.fn(),
    getIdeaById: jest.fn(),
    getLatestStageDoc: jest.fn(),
    listCardsForBoard: jest.fn(),
    listInboxIdeas: jest.fn(),
    listWorkedIdeas: jest.fn(),
  };
});

type AuditRow = {
  id: number;
  entity_type: "card" | "idea" | "stage_doc";
  entity_id: string;
};

type StageDocRow = {
  payload_json: string;
};

function createRequest(url: string): NextRequest {
  return new NextRequest(url);
}

function createDb(config: {
  maxId?: number | null;
  minId?: number | null;
  auditRows?: AuditRow[];
  stageRows?: StageDocRow[];
}) {
  return {
    prepare: jest.fn((query: string) => {
      if (query.includes("MAX(id)")) {
        return {
          first: jest.fn().mockResolvedValue({ max_id: config.maxId ?? null }),
        };
      }
      if (query.includes("MIN(id)")) {
        return {
          first: jest.fn().mockResolvedValue({ min_id: config.minId ?? null }),
        };
      }
      if (query.includes("FROM business_os_audit_log") && query.includes("WHERE id >")) {
        return {
          bind: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue({ results: config.auditRows ?? [] }),
          }),
        };
      }
      if (query.includes("FROM business_os_stage_docs") && query.includes("JOIN business_os_cards")) {
        return {
          bind: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue({ results: config.stageRows ?? [] }),
          }),
        };
      }
      if (query.includes("FROM business_os_stage_docs")) {
        return {
          all: jest.fn().mockResolvedValue({ results: config.stageRows ?? [] }),
        };
      }
      return {
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({ results: [] }),
        first: jest.fn().mockResolvedValue(null),
      };
    }),
  };
}

describe("GET /api/board-changes", () => {
  const card: Card = {
    Type: "Card",
    ID: "BRIK-ENG-0001",
    Lane: "Inbox",
    Priority: "P2",
    Owner: "Pete",
    Business: "BRIK",
    Title: "Test card",
    content: "# Test card\n\nDescription",
    filePath: "docs/business-os/cards/BRIK-ENG-0001.user.md",
    fileSha: "sha-card",
  };

  const ideaInbox: Idea = {
    Type: "Idea",
    ID: "BRIK-OPP-0001",
    Business: "BRIK",
    Status: "raw",
    Priority: "P3",
    "Created-Date": "2026-02-02",
    content: "Idea",
    filePath: "docs/business-os/ideas/inbox/BRIK-OPP-0001.user.md",
    fileSha: "sha-idea",
  };

  const ideaWorked: Idea = {
    Type: "Idea",
    ID: "BRIK-OPP-0002",
    Business: "BRIK",
    Status: "worked",
    Priority: "P2",
    "Created-Date": "2026-02-02",
    content: "Idea worked",
    filePath: "docs/business-os/ideas/worked/BRIK-OPP-0002.user.md",
    fileSha: "sha-idea-2",
  };

  const stageDoc: StageDoc = {
    Type: "Stage",
    Stage: "fact-find",
    "Card-ID": "BRIK-ENG-0001",
    Created: "2026-02-02",
    content: "Stage content",
    filePath: "docs/business-os/cards/BRIK-ENG-0001/fact-find.user.md",
    fileSha: "sha-stage",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: cursor=0 returns all entities", async () => {
    const db = createDb({
      maxId: 12,
      minId: 1,
      stageRows: [{ payload_json: JSON.stringify(stageDoc) }],
    });
    (getDb as jest.Mock).mockReturnValue(db);
    (listCardsForBoard as jest.Mock).mockResolvedValue([card]);
    (listInboxIdeas as jest.Mock).mockResolvedValue([ideaInbox]);
    (listWorkedIdeas as jest.Mock).mockResolvedValue([ideaWorked]);

    const response = await GET(createRequest("http://localhost/api/board-changes?cursor=0"));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.cursor).toBe(12);
    expect(payload.changes.cards).toEqual([card]);
    expect(payload.changes.ideas).toEqual([ideaInbox, ideaWorked]);
    expect(payload.changes.stage_docs).toEqual([stageDoc]);
  });

  it("TC-02: valid cursor returns only changes", async () => {
    const db = createDb({
      maxId: 12,
      minId: 1,
      auditRows: [
        { id: 11, entity_type: "card", entity_id: "BRIK-ENG-0001" },
        { id: 12, entity_type: "idea", entity_id: "BRIK-OPP-0001" },
        { id: 12, entity_type: "stage_doc", entity_id: "BRIK-ENG-0001:fact-find" },
      ],
    });
    (getDb as jest.Mock).mockReturnValue(db);
    (getCardById as jest.Mock).mockResolvedValue(card);
    (getIdeaById as jest.Mock).mockResolvedValue(ideaInbox);
    (getLatestStageDoc as jest.Mock).mockResolvedValue(stageDoc);

    const response = await GET(createRequest("http://localhost/api/board-changes?cursor=10"));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.cursor).toBe(12);
    expect(payload.changes.cards).toEqual([card]);
    expect(payload.changes.ideas).toEqual([ideaInbox]);
    expect(payload.changes.stage_docs).toEqual([stageDoc]);
  });

  it("TC-03: business filter applies for cursor=0", async () => {
    const db = createDb({
      maxId: 5,
      minId: 1,
      stageRows: [{ payload_json: JSON.stringify(stageDoc) }],
    });
    (getDb as jest.Mock).mockReturnValue(db);
    (listCardsForBoard as jest.Mock).mockResolvedValue([card]);
    (listInboxIdeas as jest.Mock).mockResolvedValue([ideaInbox]);
    (listWorkedIdeas as jest.Mock).mockResolvedValue([]);

    const response = await GET(
      createRequest("http://localhost/api/board-changes?cursor=0&business=BRIK")
    );
    expect(response.status).toBe(200);

    expect(listCardsForBoard).toHaveBeenCalledWith(db, { business: "BRIK" });
    expect(listInboxIdeas).toHaveBeenCalledWith(db, { business: "BRIK" });
    expect(listWorkedIdeas).toHaveBeenCalledWith(db, { business: "BRIK" });

    const payload = await response.json();
    expect(payload.changes.cards).toEqual([card]);
    expect(payload.changes.ideas).toEqual([ideaInbox]);
    expect(payload.changes.stage_docs).toEqual([stageDoc]);
  });

  it("TC-04: cursor response can be used for next poll", async () => {
    const db = createDb({ maxId: 20, minId: 1, auditRows: [] });
    (getDb as jest.Mock).mockReturnValue(db);

    const response = await GET(
      createRequest("http://localhost/api/board-changes?cursor=20")
    );
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.cursor).toBe(20);
    expect(payload.changes.cards).toEqual([]);
    expect(payload.changes.ideas).toEqual([]);
    expect(payload.changes.stage_docs).toEqual([]);
  });

  it("TC-05: stale cursor returns CURSOR_STALE", async () => {
    const db = createDb({ maxId: 12, minId: 10 });
    (getDb as jest.Mock).mockReturnValue(db);

    const response = await GET(
      createRequest("http://localhost/api/board-changes?cursor=1")
    );
    expect(response.status).toBe(410);

    const payload = await response.json();
    expect(payload.error).toBe("CURSOR_STALE");
    expect(payload.cursor).toBe(12);
  });
});
