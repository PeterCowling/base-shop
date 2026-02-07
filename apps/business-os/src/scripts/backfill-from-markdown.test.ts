import { webcrypto } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";

import type { D1Database, D1PreparedStatement } from "@acme/platform-core/d1";
import type {
  Card,
  Idea,
  StageDoc,
  StageType,
} from "@acme/platform-core/repositories/businessOs.server";

import { backfillFromMarkdown } from "./backfill-from-markdown";

type MockStatementArgs = {
  boundValues: unknown[];
};

type RunHandler = (values: unknown[]) => void;

class MockD1PreparedStatement implements D1PreparedStatement {
  private args: MockStatementArgs;
  private onRun: RunHandler;

  constructor(args: MockStatementArgs, onRun: RunHandler) {
    this.args = args;
    this.onRun = onRun;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    this.args.boundValues = values;
    return this;
  }

  async all<T = unknown>(): Promise<{ results?: T[] }> {
    return { results: [] };
  }

  async first<T = unknown>(): Promise<T | null> {
    return null;
  }

  async run(): Promise<{ success?: boolean; meta?: { changes?: number } }> {
    this.onRun(this.args.boundValues);
    return { success: true, meta: { changes: 1 } };
  }
}

class MockD1Database implements D1Database {
  private counters = new Map<string, number>();
  private lastStatementArgs: MockStatementArgs = { boundValues: [] };

  prepare(_query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(this.lastStatementArgs, (values) => {
      const [key, value] = values as [string, string];
      if (typeof key === "string" && typeof value === "string") {
        this.counters.set(key, Number.parseInt(value, 10));
      }
    });
  }

  async batch(_statements: D1PreparedStatement[]): Promise<unknown[]> {
    return [];
  }

  getCounter(key: string): number | undefined {
    return this.counters.get(key);
  }
}

async function writeFile(root: string, relativePath: string, content: string): Promise<void> {
  const absolutePath = path.join(root, relativePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-00
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-00
  await fs.writeFile(absolutePath, content, "utf-8");
}

function createCardMarkdown(id: string): string {
  return `---\nType: Card\nLane: Planned\nPriority: P1\nOwner: Pete\nID: ${id}\nBusiness: BRIK\n---\n\n# Test Card\n\nCard content.\n`;
}

function createIdeaMarkdown(id: string): string {
  return `---\nType: Idea\nID: ${id}\nBusiness: BRIK\nStatus: raw\n---\n\nIdea content.\n`;
}

function createStageMarkdown(cardId: string): string {
  return `---\nType: Stage\nStage: fact-find\nCard-ID: ${cardId}\n---\n\nStage content.\n`;
}

function createRepositoryMocks() {
  const cards = new Map<string, Card>();
  const ideas = new Map<string, Idea>();
  const stageDocs = new Map<string, StageDoc>();
  const auditEntries: Array<{ entity_type: string; entity_id: string; changes_json?: string | null }> = [];

  return {
    cards,
    ideas,
    stageDocs,
    auditEntries,
    repositories: {
      async getCardById(_db: D1Database, id: string) {
        return cards.get(id) ?? null;
      },
      async upsertCard(_db: D1Database, card: Card) {
        cards.set(card.ID, card);
        return { success: true, card };
      },
      async getIdeaById(_db: D1Database, id: string) {
        return ideas.get(id) ?? null;
      },
      async upsertIdea(_db: D1Database, idea: Idea, _location: "inbox" | "worked") {
        ideas.set(idea.ID ?? "", idea);
        return { success: true, idea };
      },
      async getLatestStageDoc(_db: D1Database, cardId: string, stage: StageType) {
        const key = `${cardId}:${stage}`;
        return stageDocs.get(key) ?? null;
      },
      async upsertStageDoc(_db: D1Database, stageDoc: StageDoc) {
        const key = `${stageDoc["Card-ID"]}:${stageDoc.Stage}`;
        stageDocs.set(key, stageDoc);
        return { success: true, stageDoc, id: key };
      },
      async appendAuditEntry(
        _db: D1Database,
        entry: { entity_type: string; entity_id: string; changes_json?: string | null }
      ) {
        auditEntries.push(entry);
        return { success: true, id: auditEntries.length };
      },
    },
  };
}

describe("backfillFromMarkdown", () => {
  let tempDir: string;
  let db: MockD1Database;
  let originalCrypto: Crypto | undefined;

  beforeAll(() => {
    originalCrypto = globalThis.crypto as Crypto | undefined;
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
  });

  afterAll(() => {
    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    } else {
      delete (globalThis as { crypto?: Crypto }).crypto;
    }
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bos-backfill-"));
    db = new MockD1Database();

    await writeFile(tempDir, "docs/business-os/cards/BRIK-ENG-0020.user.md", createCardMarkdown("BRIK-ENG-0020"));
    await writeFile(tempDir, "docs/business-os/ideas/inbox/BRIK-OPP-0002.user.md", createIdeaMarkdown("BRIK-OPP-0002"));
    await writeFile(tempDir, "docs/business-os/cards/BRIK-ENG-0020/fact-find.user.md", createStageMarkdown("BRIK-ENG-0020"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("TC-01: dry-run mode produces no writes", async () => {
    const { repositories, auditEntries, cards, ideas, stageDocs } = createRepositoryMocks();

    const result = await backfillFromMarkdown({
      db,
      repoRoot: tempDir,
      dryRun: true,
      repositories,
    });

    expect(result.stats.cards.wouldInsert).toBe(1);
    expect(result.stats.ideas.wouldInsert).toBe(1);
    expect(result.stats.stageDocs.wouldInsert).toBe(1);
    expect(cards.size).toBe(0);
    expect(ideas.size).toBe(0);
    expect(stageDocs.size).toBe(0);
    expect(auditEntries).toHaveLength(0);
  });

  it("TC-02: full backfill inserts entities with audit log", async () => {
    const { repositories, auditEntries, cards, ideas, stageDocs } = createRepositoryMocks();

    const result = await backfillFromMarkdown({
      db,
      repoRoot: tempDir,
      repositories,
    });

    expect(result.stats.cards.inserted).toBe(1);
    expect(result.stats.ideas.inserted).toBe(1);
    expect(result.stats.stageDocs.inserted).toBe(1);
    expect(cards.size).toBe(1);
    expect(ideas.size).toBe(1);
    expect(stageDocs.size).toBe(1);
    expect(auditEntries.length).toBe(3);
    expect(auditEntries[0]?.changes_json).toContain("backfill");
  });

  it("TC-03: round-trip validation passes for matching export", async () => {
    const { repositories } = createRepositoryMocks();

    const result = await backfillFromMarkdown({
      db,
      repoRoot: tempDir,
      repositories,
      validate: true,
    });

    expect(result.validationFailures).toHaveLength(0);
  });

  it("TC-04: conflict detection prevents overwrites", async () => {
    const { repositories, cards } = createRepositoryMocks();
    const conflictingCard: Card = {
      Type: "Card",
      ID: "BRIK-ENG-0020",
      Lane: "Inbox",
      Priority: "P1",
      Owner: "Pete",
      Business: "BRIK",
      content: "Different content",
      filePath: "docs/business-os/cards/BRIK-ENG-0020.user.md",
      fileSha: "conflict",
    };
    cards.set("BRIK-ENG-0020", conflictingCard);

    const result = await backfillFromMarkdown({
      db,
      repoRoot: tempDir,
      repositories,
    });

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.entityId).toBe("BRIK-ENG-0020");
    expect(result.stats.cards.inserted).toBe(0);
  });

  it("TC-05: ID counters sync to max IDs", async () => {
    const { repositories } = createRepositoryMocks();

    await backfillFromMarkdown({
      db,
      repoRoot: tempDir,
      repositories,
    });

    expect(db.getCounter("counter:card:BRIK-ENG")).toBe(20);
    expect(db.getCounter("counter:idea:BRIK-OPP")).toBe(2);
  });
});
