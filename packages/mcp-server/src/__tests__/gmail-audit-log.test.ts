/** @jest-environment node */

/**
 * TASK-01: Tests for the append-only audit log in gmail.ts.
 *
 * TC-01-01: handleGetEmail writes { ts, messageId, action: "lock-acquired", actor } entry
 *           to the audit log — verified by reading file after call.
 * TC-01-02: handleMarkProcessed writes { ts, messageId, action: "outcome", actor, result }
 *           entry — verified by reading file after call.
 * TC-01-03: each line in the audit log file is parseable as JSON (JSON-lines format) —
 *           verified by splitting on newline and parsing each non-empty line.
 * TC-01-04: audit log is append-only — calling handleGetEmail twice for different messageIds
 *           produces two entries; first entry is unchanged.
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="gmail-audit-log"
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool } from "../tools/gmail";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GmailLabel = { id: string; name: string };

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  internalDate: string;
  payload: {
    headers: { name: string; value: string }[];
  };
  snippet?: string;
};

type GmailStub = {
  users: {
    labels: {
      list: jest.Mock;
      create: jest.Mock;
    };
    messages: {
      get: jest.Mock;
      modify: jest.Mock;
      list: jest.Mock;
    };
    threads: {
      get: jest.Mock;
      list: jest.Mock;
    };
    drafts: {
      create: jest.Mock;
    };
  };
};

interface AuditEntry {
  ts: string;
  messageId?: string;
  action?: "lock-acquired" | "lock-released" | "outcome";
  actor: string;
  result?: string;
}

interface TelemetryEntry {
  ts: string;
  event_key: string;
  source_path: string;
  actor: string;
  message_id?: string | null;
  action?: string;
  queue_from?: string | null;
  queue_to?: string | null;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGmailStub({
  labels,
  messages,
}: {
  labels?: GmailLabel[];
  messages: Record<string, GmailMessage>;
}): { gmail: GmailStub; messageStore: Record<string, GmailMessage>; labelsStore: GmailLabel[] } {
  const labelsStore = labels ? [...labels] : [];
  const messageStore = { ...messages };
  let labelCounter = labelsStore.length + 1;

  const gmail: GmailStub = {
    users: {
      labels: {
        list: jest.fn(async () => ({ data: { labels: labelsStore } })),
        create: jest.fn(async ({ requestBody }: { requestBody: { name: string } }) => {
          const newLabel = { id: `label-${labelCounter++}`, name: requestBody.name };
          labelsStore.push(newLabel);
          return { data: newLabel };
        }),
      },
      messages: {
        list: jest.fn(async () => ({
          data: { messages: Object.values(messageStore).map(msg => ({ id: msg.id })) },
        })),
        get: jest.fn(async ({ id }: { id: string }) => ({ data: messageStore[id] })),
        modify: jest.fn(
          async ({
            id,
            requestBody,
          }: {
            id: string;
            requestBody: { addLabelIds?: string[]; removeLabelIds?: string[] };
          }) => {
            const message = messageStore[id];
            if (!message) {
              throw new Error(`Message not found: ${id}`);
            }
            const remove = requestBody.removeLabelIds ?? [];
            const add = requestBody.addLabelIds ?? [];
            message.labelIds = message.labelIds.filter(labelId => !remove.includes(labelId));
            for (const labelId of add) {
              if (!message.labelIds.includes(labelId)) {
                message.labelIds.push(labelId);
              }
            }
            return { data: message };
          }
        ),
      },
      threads: {
        list: jest.fn(async () => ({ data: { threads: [] } })),
        get: jest.fn(async () => ({ data: { messages: [] } })),
      },
      drafts: {
        create: jest.fn(async () => ({
          data: { id: "draft-1", message: { id: "message-1" } },
        })),
      },
    },
  };

  return { gmail, messageStore, labelsStore };
}

function makeMessage(id: string, extraLabels: string[] = []): GmailMessage {
  return {
    id,
    threadId: `thread-${id}`,
    labelIds: ["label-needs", ...extraLabels],
    internalDate: String(Date.now()),
    payload: { headers: [] },
  };
}

function readAuditEntries(logPath: string): Array<AuditEntry | TelemetryEntry> {
  if (!fs.existsSync(logPath)) return [];
  const raw = fs.readFileSync(logPath, "utf-8");
  return raw
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => JSON.parse(line) as AuditEntry | TelemetryEntry);
}

function readLegacyAuditEntries(logPath: string): AuditEntry[] {
  return readAuditEntries(logPath).filter(
    (entry): entry is AuditEntry =>
      typeof (entry as { action?: unknown }).action === "string",
  );
}

function readTelemetryEntries(logPath: string): TelemetryEntry[] {
  return readAuditEntries(logPath).filter(
    (entry): entry is TelemetryEntry =>
      typeof (entry as { event_key?: unknown }).event_key === "string",
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("gmail audit log (TASK-01)", () => {
  let tmpDir: string;
  let auditLogPath: string;
  const needsProcessing: GmailLabel = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
  const processing: GmailLabel = { id: "label-processing", name: "Brikette/Queue/In-Progress" };

  beforeEach(() => {
    jest.clearAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gmail-audit-test-"));
    auditLogPath = path.join(tmpDir, "email-audit-log.jsonl");
    // Redirect audit log writes to temp directory via env var
    process.env.AUDIT_LOG_PATH = auditLogPath;
  });

  afterEach(() => {
    delete process.env.AUDIT_LOG_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // TC-01-01
  // -------------------------------------------------------------------------
  it("TC-01-01: handleGetEmail writes lock-acquired entry to audit log", async () => {
    const { gmail } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: { "msg-tc01": makeMessage("msg-tc01") },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", {
      emailId: "msg-tc01",
      actor: "claude",
    });

    expect(result).toHaveProperty("content");
    expect((result as { isError?: boolean }).isError).not.toBe(true);

    const entries = readLegacyAuditEntries(auditLogPath);
    expect(entries).toHaveLength(1);

    const entry = entries[0];
    expect(entry.messageId).toBe("msg-tc01");
    expect(entry.action).toBe("lock-acquired");
    expect(entry.actor).toBe("claude");
    expect(typeof entry.ts).toBe("string");
    // ts must be a valid ISO 8601 date
    expect(() => new Date(entry.ts).toISOString()).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // TC-01-02
  // -------------------------------------------------------------------------
  it("TC-01-02: handleMarkProcessed writes outcome entry to audit log", async () => {
    // Pre-populate the message with the In-Progress label so handleMarkProcessed can act on it
    const { gmail } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: {
        "msg-tc02": {
          ...makeMessage("msg-tc02"),
          labelIds: [processing.id],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-tc02",
      action: "drafted",
      actor: "claude",
    });

    expect(result).toHaveProperty("content");
    expect((result as { isError?: boolean }).isError).not.toBe(true);

    const entries = readLegacyAuditEntries(auditLogPath);
    // handleMarkProcessed now writes two entries: lock-released + outcome
    expect(entries.length).toBeGreaterThanOrEqual(1);

    const outcomeEntry = entries.find(e => e.action === "outcome");
    expect(outcomeEntry).toBeDefined();
    expect(outcomeEntry!.messageId).toBe("msg-tc02");
    expect(outcomeEntry!.action).toBe("outcome");
    expect(outcomeEntry!.actor).toBe("claude");
    expect(outcomeEntry!.result).toBe("drafted");
    expect(typeof outcomeEntry!.ts).toBe("string");
    expect(() => new Date(outcomeEntry!.ts).toISOString()).not.toThrow();

    const telemetryEntries = readTelemetryEntries(auditLogPath);
    const labeled = telemetryEntries.find(e => e.event_key === "email_outcome_labeled");
    expect(labeled).toBeDefined();
    expect(labeled?.source_path).toBe("queue");
    expect(labeled?.action).toBe("drafted");

    const transition = telemetryEntries.find(e => e.event_key === "email_queue_transition");
    expect(transition).toBeDefined();
    expect(transition?.source_path).toBe("queue");
    expect(transition?.queue_from).toBe("Brikette/Queue/In-Progress");
    expect(transition?.queue_to).toBeNull();
  });

  // -------------------------------------------------------------------------
  // TC-01-03
  // -------------------------------------------------------------------------
  it("TC-01-03: each line in the audit log file is parseable as JSON", async () => {
    const { gmail: g1 } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: { "msg-tc03a": makeMessage("msg-tc03a") },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: g1 });
    await handleGmailTool("gmail_get_email", { emailId: "msg-tc03a", actor: "human" });

    const { gmail: g2 } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: {
        "msg-tc03b": { ...makeMessage("msg-tc03b"), labelIds: [processing.id] },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: g2 });
    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-tc03b",
      action: "skipped",
      actor: "human",
    });

    expect(fs.existsSync(auditLogPath)).toBe(true);
    const raw = fs.readFileSync(auditLogPath, "utf-8");
    const lines = raw.split("\n").filter(line => line.trim() !== "");
    expect(lines.length).toBeGreaterThan(0);

    for (const line of lines) {
      // Each non-empty line must be valid JSON
      expect(() => JSON.parse(line)).not.toThrow();
      const parsed = JSON.parse(line) as unknown;
      expect(typeof parsed).toBe("object");
      expect(parsed).not.toBeNull();
    }
  });

  // -------------------------------------------------------------------------
  // TC-01-04
  // -------------------------------------------------------------------------
  it("TC-01-04: audit log is append-only — two handleGetEmail calls produce two entries; first entry unchanged", async () => {
    const { gmail: g1 } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: { "msg-tc04a": makeMessage("msg-tc04a") },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: g1 });
    await handleGmailTool("gmail_get_email", { emailId: "msg-tc04a", actor: "claude" });

    // Capture first entry text before second write
    const rawAfterFirst = fs.readFileSync(auditLogPath, "utf-8");
    const firstLine = rawAfterFirst.split("\n").filter(l => l.trim() !== "")[0];

    const { gmail: g2 } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: { "msg-tc04b": makeMessage("msg-tc04b") },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: g2 });
    await handleGmailTool("gmail_get_email", { emailId: "msg-tc04b", actor: "human" });

    const entries = readLegacyAuditEntries(auditLogPath);
    expect(entries).toHaveLength(2);

    // First entry must be unchanged
    const rawAfterSecond = fs.readFileSync(auditLogPath, "utf-8");
    const firstLineAfterSecond = rawAfterSecond.split("\n").filter(l => l.trim() !== "")[0];
    expect(firstLineAfterSecond).toBe(firstLine);

    // Second entry is for the second messageId
    expect(entries[0].messageId).toBe("msg-tc04a");
    expect(entries[1].messageId).toBe("msg-tc04b");
  });

  it("TC-03-03: gmail_telemetry_daily_rollup reports drafted/deferred/requeued/fallback totals", async () => {
    const lines = [
      {
        ts: "2026-02-19T08:00:00.000Z",
        event_key: "email_draft_created",
        source_path: "queue",
        actor: "system",
      },
      {
        ts: "2026-02-19T08:05:00.000Z",
        event_key: "email_draft_deferred",
        source_path: "reception",
        actor: "system",
      },
      {
        ts: "2026-02-19T08:10:00.000Z",
        event_key: "email_queue_transition",
        source_path: "queue",
        actor: "codex",
        queue_from: "Brikette/Queue/In-Progress",
        queue_to: "Brikette/Queue/Needs-Processing",
      },
      {
        ts: "2026-02-19T08:11:00.000Z",
        event_key: "email_fallback_detected",
        source_path: "queue",
        actor: "system",
      },
    ];
    fs.writeFileSync(
      auditLogPath,
      `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`,
      "utf-8",
    );

    const result = await handleGmailTool("gmail_telemetry_daily_rollup", {
      startDate: "2026-02-19",
      days: 2,
    });

    expect((result as { isError?: boolean }).isError).not.toBe(true);
    const payload = JSON.parse(result.content[0].text) as {
      totals: { drafted: number; deferred: number; requeued: number; fallback: number };
      daily: Array<{ day: string; drafted: number; deferred: number; requeued: number; fallback: number }>;
    };
    expect(payload.totals).toEqual({
      drafted: 1,
      deferred: 1,
      requeued: 1,
      fallback: 1,
    });
    expect(payload.daily[0]).toMatchObject({
      day: "2026-02-19",
      drafted: 1,
      deferred: 1,
      requeued: 1,
      fallback: 1,
    });
  });
});
