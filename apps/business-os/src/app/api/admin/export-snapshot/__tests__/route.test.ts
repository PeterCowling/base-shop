import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  type Card,
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
    listCardsForBoard: jest.fn(),
    listInboxIdeas: jest.fn(),
    listWorkedIdeas: jest.fn(),
  };
});

const VALID_KEY = `${"A".repeat(31)}!`;

type StageDocRow = {
  payload_json: string;
};

function createRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(url, { headers });
}

function createDb(config: { maxId?: number | null; stageRows?: StageDocRow[] }) {
  return {
    prepare: jest.fn((query: string) => {
      if (query.includes("MAX(id)")) {
        return {
          first: jest.fn().mockResolvedValue({ max_id: config.maxId ?? null }),
        };
      }
      if (query.includes("FROM business_os_stage_docs")) {
        return {
          all: jest.fn().mockResolvedValue({ results: config.stageRows ?? [] }),
        };
      }
      return {
        all: jest.fn().mockResolvedValue({ results: [] }),
        first: jest.fn().mockResolvedValue(null),
      };
    }),
  };
}

describe("/api/admin/export-snapshot", () => {
  const card: Card = {
    Type: "Card",
    ID: "BRIK-ENG-0001",
    Lane: "Inbox",
    Priority: "P1",
    Owner: "Pete",
    Business: "BRIK",
    Title: "Test card",
    content: "# Card\n\nDetails",
    filePath: "docs/business-os/cards/BRIK-ENG-0001.user.md",
  };

  const ideaInbox: Idea = {
    Type: "Idea",
    ID: "BRIK-OPP-0001",
    Business: "BRIK",
    Status: "raw",
    "Created-Date": "2026-02-02",
    content: "Idea",
    filePath: "docs/business-os/ideas/inbox/BRIK-OPP-0001.user.md",
  };

  const ideaWorked: Idea = {
    Type: "Idea",
    ID: "BRIK-OPP-0002",
    Business: "BRIK",
    Status: "worked",
    "Created-Date": "2026-02-02",
    content: "Idea worked",
    filePath: "docs/business-os/ideas/worked/BRIK-OPP-0002.user.md",
  };

  const stageDoc: StageDoc = {
    Type: "Stage",
    Stage: "fact-find",
    "Card-ID": "BRIK-ENG-0001",
    Created: "2026-02-02",
    content: "Stage content",
    filePath: "docs/business-os/cards/BRIK-ENG-0001/fact-find.user.md",
  };

  beforeEach(() => {
    process.env.BOS_EXPORT_API_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.BOS_EXPORT_API_KEY;
    jest.clearAllMocks();
  });

  it("TC-01: GET with valid auth returns snapshot", async () => {
    const db = createDb({
      maxId: 12,
      stageRows: [{ payload_json: JSON.stringify(stageDoc) }],
    });
    (getDb as jest.Mock).mockReturnValue(db);
    (listCardsForBoard as jest.Mock).mockResolvedValue([card]);
    (listInboxIdeas as jest.Mock).mockResolvedValue([ideaInbox]);
    (listWorkedIdeas as jest.Mock).mockResolvedValue([ideaWorked]);

    const request = createRequest("http://localhost/api/admin/export-snapshot", {
      "x-export-api-key": VALID_KEY,
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(typeof payload.exportId).toBe("string");
    expect(typeof payload.timestamp).toBe("string");
    expect(payload.auditCursor).toBe(12);
    expect(payload.cards).toHaveLength(1);
    expect(payload.ideas).toHaveLength(2);
    expect(payload.stageDocs).toHaveLength(1);
  });

  it("TC-02: response paths match expected structure", async () => {
    const db = createDb({
      maxId: 1,
      stageRows: [{ payload_json: JSON.stringify(stageDoc) }],
    });
    (getDb as jest.Mock).mockReturnValue(db);
    (listCardsForBoard as jest.Mock).mockResolvedValue([card]);
    (listInboxIdeas as jest.Mock).mockResolvedValue([ideaInbox]);
    (listWorkedIdeas as jest.Mock).mockResolvedValue([]);

    const request = createRequest("http://localhost/api/admin/export-snapshot", {
      "x-export-api-key": VALID_KEY,
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(payload.cards[0].path).toBe(card.filePath);
    expect(payload.cards[0].agentPath).toBe(
      "docs/business-os/cards/BRIK-ENG-0001.agent.md"
    );
    expect(payload.ideas[0].path).toBe(ideaInbox.filePath);
    expect(payload.stageDocs[0].path).toBe(
      "docs/business-os/cards/BRIK-ENG-0001/fact-find.user.md"
    );
  });

  it("TC-03: content is pre-serialized markdown", async () => {
    const db = createDb({ maxId: 1, stageRows: [] });
    (getDb as jest.Mock).mockReturnValue(db);
    (listCardsForBoard as jest.Mock).mockResolvedValue([card]);
    (listInboxIdeas as jest.Mock).mockResolvedValue([ideaInbox]);
    (listWorkedIdeas as jest.Mock).mockResolvedValue([]);

    const request = createRequest("http://localhost/api/admin/export-snapshot", {
      "x-export-api-key": VALID_KEY,
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(payload.cards[0].content.startsWith("---")).toBe(true);
    expect(payload.ideas[0].content.startsWith("---")).toBe(true);
  });

  it("TC-04: missing or invalid auth returns 401", async () => {
    const db = createDb({ maxId: 1, stageRows: [] });
    (getDb as jest.Mock).mockReturnValue(db);

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const missingAuth = await GET(
      createRequest("http://localhost/api/admin/export-snapshot")
    );
    expect(missingAuth.status).toBe(401);

    const invalidAuth = await GET(
      createRequest("http://localhost/api/admin/export-snapshot", {
        "x-export-api-key": "invalid-key",
      })
    );
    expect(invalidAuth.status).toBe(401);

    warnSpy.mockRestore();
  });

  it("TC-05: auditCursor matches latest audit log entry", async () => {
    const db = createDb({ maxId: 33, stageRows: [] });
    (getDb as jest.Mock).mockReturnValue(db);
    (listCardsForBoard as jest.Mock).mockResolvedValue([]);
    (listInboxIdeas as jest.Mock).mockResolvedValue([]);
    (listWorkedIdeas as jest.Mock).mockResolvedValue([]);

    const request = createRequest("http://localhost/api/admin/export-snapshot", {
      "x-export-api-key": VALID_KEY,
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(payload.auditCursor).toBe(33);
  });
});
