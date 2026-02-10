import { describe, expect,it } from "@jest/globals";

import type { D1Database, D1PreparedStatement } from "../../d1/types";
import { countIdeas, listIdeas } from "../businessOsIdeas.server";

class CapturePreparedStatement implements D1PreparedStatement {
  constructor(private readonly db: CaptureDatabase) {}

  bind(...args: unknown[]): D1PreparedStatement {
    this.db.lastBinds = args;
    return this;
  }

  async all<T = unknown>(): Promise<{ results?: T[] }> {
    return { results: this.db.nextResults as T[] };
  }

  async first<T = unknown>(): Promise<T | null> {
    return (this.db.nextFirstResult as T) ?? null;
  }

  async run(): Promise<{ success?: boolean; meta?: { last_row_id?: number } }> {
    return { success: true, meta: { last_row_id: 1 } };
  }
}

class CaptureDatabase implements D1Database {
  public lastQuery = "";
  public lastBinds: unknown[] = [];
  public nextResults: unknown[] = [];
  public nextFirstResult: unknown = null;

  prepare(query: string): D1PreparedStatement {
    this.lastQuery = query;
    return new CapturePreparedStatement(this);
  }

  async batch(_statements: D1PreparedStatement[]): Promise<unknown[]> {
    return [];
  }
}

describe("listIdeas", () => {
  it("TC-01: applies priority-first deterministic ordering", async () => {
    const db = new CaptureDatabase();
    db.nextResults = [
      {
        id: "BRIK-OPP-0001",
        business: "BRIK",
        status: "raw",
        priority: "P1",
        location: "inbox",
        payload_json: JSON.stringify({
          Type: "Idea",
          ID: "BRIK-OPP-0001",
          Business: "BRIK",
          Status: "raw",
          Priority: "P1",
          "Created-Date": "2026-02-09",
          content: "# Idea one",
          filePath: "docs/business-os/ideas/inbox/BRIK-OPP-0001.user.md",
        }),
        created_at: "2026-02-09T10:00:00.000Z",
        updated_at: "2026-02-09T10:00:00.000Z",
      },
    ];

    const ideas = await listIdeas(db, {});

    expect(ideas).toHaveLength(1);
    expect(db.lastQuery).toContain("CASE priority");
    expect(db.lastQuery).toContain(
      "COALESCE(json_extract(payload_json, '$.\"Created-Date\"'), created_at) DESC"
    );
    expect(db.lastQuery).toContain("id ASC");
  });

  it("TC-02: applies each filter type and pagination in query binds", async () => {
    const db = new CaptureDatabase();

    await listIdeas(db, {
      location: "inbox",
      business: "BRIK",
      status: "raw",
      priorities: ["P0", "P2"],
      tagContains: "ops",
      search: "whatsapp",
      limit: 50,
      offset: 100,
    });

    expect(db.lastQuery).toContain("WHERE location = ? AND business = ? AND status = ?");
    expect(db.lastQuery).toContain("priority IN (?, ?)");
    expect(db.lastQuery).toContain("json_each(payload_json, '$.Tags') tags");
    expect(db.lastQuery).toContain("LOWER(id) LIKE ?");
    expect(db.lastQuery).toContain("LIMIT ? OFFSET ?");
    expect(db.lastBinds).toEqual([
      "inbox",
      "BRIK",
      "raw",
      "P0",
      "P2",
      "%ops%",
      "%whatsapp%",
      "%whatsapp%",
      "%whatsapp%",
      "%whatsapp%",
      50,
      100,
    ]);
  });

  it("TC-03: clamps invalid limit/offset values deterministically", async () => {
    const db = new CaptureDatabase();

    await listIdeas(db, { limit: 0, offset: -50 });

    expect(db.lastBinds).toEqual([1, 0]);
  });
});

describe("countIdeas", () => {
  it("uses the same filter contract and returns numeric totals", async () => {
    const db = new CaptureDatabase();
    db.nextFirstResult = { total: "12" };

    const total = await countIdeas(db, {
      location: "worked",
      priorities: ["P1"],
      search: "email",
    });

    expect(total).toBe(12);
    expect(db.lastQuery).toContain("SELECT COUNT(1) AS total");
    expect(db.lastQuery).toContain("location = ?");
    expect(db.lastQuery).toContain("priority IN (?)");
  });
});
