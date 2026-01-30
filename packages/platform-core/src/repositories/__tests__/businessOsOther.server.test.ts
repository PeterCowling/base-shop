/**
 * Business OS Other Repositories Tests
 *
 * Basic unit tests for Ideas, Stage Docs, and Audit repositories.
 * Uses mocked D1Database (no Cloudflare runtime required).
 */

import { describe, it, expect } from "@jest/globals";

import type { D1Database, D1PreparedStatement } from "../../d1/types";
import {
  listInboxIdeas,
  getIdeaById,
  upsertIdea,
  type Idea,
} from "../businessOsIdeas.server";
import {
  listStageDocsForCard,
  getLatestStageDoc,
  upsertStageDoc,
  type StageDoc,
} from "../businessOsStageDocs.server";
import {
  appendAuditEntry,
  listAuditEntries,
} from "../businessOsAudit.server";

// ============================================================================
// Simple Mock D1Database
// ============================================================================

class SimpleMockD1PreparedStatement implements D1PreparedStatement {
  private mockResults: unknown[] = [];
  private mockFirstResult: unknown = null;

  setMockResults(results: unknown[]): void {
    this.mockResults = results;
  }

  setMockFirstResult(result: unknown): void {
    this.mockFirstResult = result;
  }

  bind(..._args: unknown[]): D1PreparedStatement {
    return this;
  }

  async all<T = unknown>(): Promise<{ results?: T[] }> {
    return { results: this.mockResults as T[] };
  }

  async first<T = unknown>(): Promise<T | null> {
    return (this.mockFirstResult as T) ?? null;
  }

  async run(): Promise<{ success?: boolean; meta?: { last_row_id?: number } }> {
    return { success: true, meta: { last_row_id: 1 } };
  }
}

class SimpleMockD1Database implements D1Database {
  private nextResults: unknown[] = [];
  private nextFirstResult: unknown = null;

  prepare(_query: string): D1PreparedStatement {
    const stmt = new SimpleMockD1PreparedStatement();
    if (this.nextResults.length > 0) {
      stmt.setMockResults(this.nextResults);
      this.nextResults = [];
    }
    if (this.nextFirstResult !== null) {
      stmt.setMockFirstResult(this.nextFirstResult);
      this.nextFirstResult = null;
    }
    return stmt;
  }

  async batch(_statements: D1PreparedStatement[]): Promise<unknown[]> {
    return [];
  }

  setMockResults(results: unknown[]): void {
    this.nextResults = results;
  }

  setMockFirstResult(result: unknown): void {
    this.nextFirstResult = result;
  }
}

// ============================================================================
// Ideas Repository Tests
// ============================================================================

describe("Ideas Repository", () => {
  const mockIdea: Idea = {
    Type: "Idea",
    ID: "BRIK-OPP-0001",
    Business: "BRIK",
    Status: "raw",
    content: "Test idea content",
    filePath: "/test/idea.md",
  };

  const mockIdeaRow = {
    id: "BRIK-OPP-0001",
    business: "BRIK",
    status: "raw",
    location: "inbox",
    payload_json: JSON.stringify(mockIdea),
    created_at: "2026-01-30T10:00:00Z",
    updated_at: "2026-01-30T10:00:00Z",
  };

  it("lists inbox ideas", async () => {
    const db = new SimpleMockD1Database();
    db.setMockResults([mockIdeaRow]);

    const ideas = await listInboxIdeas(db, {});

    expect(ideas).toHaveLength(1);
    expect(ideas[0]?.ID).toBe("BRIK-OPP-0001");
  });

  it("gets idea by ID", async () => {
    const db = new SimpleMockD1Database();
    db.setMockFirstResult(mockIdeaRow);

    const idea = await getIdeaById(db, "BRIK-OPP-0001");

    expect(idea).not.toBeNull();
    expect(idea?.ID).toBe("BRIK-OPP-0001");
  });

  it("upserts idea", async () => {
    const db = new SimpleMockD1Database();
    db.setMockFirstResult(mockIdeaRow);

    const result = await upsertIdea(db, mockIdea, "inbox");

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Stage Docs Repository Tests
// ============================================================================

describe("Stage Docs Repository", () => {
  const mockStageDoc: StageDoc = {
    Type: "Stage",
    Stage: "fact-find",
    "Card-ID": "BRIK-ENG-0001",
    content: "Fact-find content",
    filePath: "/test/fact-find.md",
  };

  const mockStageDocRow = {
    id: "stage-doc-1",
    card_id: "BRIK-ENG-0001",
    stage: "fact-find",
    payload_json: JSON.stringify(mockStageDoc),
    created_at: "2026-01-30T10:00:00Z",
    updated_at: "2026-01-30T10:00:00Z",
  };

  it("lists stage docs for card", async () => {
    const db = new SimpleMockD1Database();
    db.setMockResults([mockStageDocRow]);

    const docs = await listStageDocsForCard(db, "BRIK-ENG-0001");

    expect(docs).toHaveLength(1);
    expect(docs[0]?.["Card-ID"]).toBe("BRIK-ENG-0001");
  });

  it("gets latest stage doc", async () => {
    const db = new SimpleMockD1Database();
    db.setMockFirstResult(mockStageDocRow);

    const doc = await getLatestStageDoc(db, "BRIK-ENG-0001", "fact-find");

    expect(doc).not.toBeNull();
    expect(doc?.Stage).toBe("fact-find");
  });

  it("upserts stage doc", async () => {
    const db = new SimpleMockD1Database();
    db.setMockFirstResult(mockStageDocRow);

    const result = await upsertStageDoc(db, mockStageDoc, null);

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });
});

// ============================================================================
// Audit Log Repository Tests
// ============================================================================

describe("Audit Log Repository", () => {
  const mockAuditRow = {
    id: 1,
    entity_type: "card",
    entity_id: "BRIK-ENG-0001",
    action: "create",
    actor: "Pete",
    timestamp: "2026-01-30T10:00:00Z",
    changes_json: JSON.stringify({ lane: "Inbox" }),
  };

  it("appends audit entry", async () => {
    const db = new SimpleMockD1Database();

    const result = await appendAuditEntry(db, {
      entity_type: "card",
      entity_id: "BRIK-ENG-0001",
      action: "create",
      actor: "Pete",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe(1);
  });

  it("lists audit entries for entity", async () => {
    const db = new SimpleMockD1Database();
    db.setMockResults([mockAuditRow]);

    const entries = await listAuditEntries(db, "card", "BRIK-ENG-0001");

    expect(entries).toHaveLength(1);
    expect(entries[0]?.entity_id).toBe("BRIK-ENG-0001");
  });
});
