/** @jest-environment node */

/**
 * TC-R3: non-dry-run gmail_reconcile_in_progress emits one email_reconcile_recovery
 *         telemetry event per recovered email (written to audit log via AUDIT_LOG_PATH).
 * TC-R4: dry-run produces no email_reconcile_recovery entries.
 *
 * Test seam: appendTelemetryEvent is local and not exported; tests read the
 * JSONL audit log file directly, matching the pattern in gmail-create-draft.test.ts.
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="gmail-reconciliation"
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, REQUIRED_LABELS, setLockStore } from "../tools/gmail";
import { createLockStore } from "../utils/lock-store";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "reconcile-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  jest.clearAllMocks();
  const logPath = process.env.AUDIT_LOG_PATH!;
  if (fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "", "utf-8");
  }
});

function buildReconcileStub() {
  const requiredLabelsWithIds = REQUIRED_LABELS.map((name, i) => ({ id: `label-${i + 1}`, name }));

  return {
    users: {
      labels: {
        list: jest.fn(async () => ({ data: { labels: requiredLabelsWithIds } })),
        create: jest.fn(async ({ requestBody }: { requestBody: { name: string } }) => ({
          data: { id: `label-created`, name: requestBody.name },
        })),
      },
      messages: {
        list: jest.fn(async () => ({
          data: { messages: [{ id: "stale-msg-1" }] },
        })),
        get: jest.fn(async () => ({
          data: {
            id: "stale-msg-1",
            labelIds: [],
            internalDate: String(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            payload: {
              headers: [
                { name: "Date", value: "Mon, 01 Jan 2024 00:00:00 +0000" },
                { name: "From", value: "guest@example.com" },
                { name: "Subject", value: "booking inquiry" },
              ],
            },
            snippet: "Please let me know if there is availability",
          },
        })),
        modify: jest.fn(async () => ({ data: {} })),
      },
      threads: {
        get: jest.fn(async () => ({ data: { messages: [] } })),
      },
      drafts: {
        list: jest.fn(async () => ({ data: { drafts: [] } })),
        create: jest.fn(async () => ({ data: { id: "draft-1", message: { id: "msg-1" } } })),
      },
    },
  };
}

function readAuditEntries(logPath: string): Array<Record<string, unknown>> {
  if (!fs.existsSync(logPath)) return [];
  return fs
    .readFileSync(logPath, "utf-8")
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}

describe("gmail_reconcile_in_progress — telemetry emit (TASK-01)", () => {
  // TC-R3: non-dry-run emits email_reconcile_recovery per recovered email
  it("TC-R3: non-dry-run reconcile emits email_reconcile_recovery event to audit log", async () => {
    const stub = buildReconcileStub();
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_reconcile_in_progress", {
      dryRun: false,
      staleHours: 1,
      limit: 10,
      actor: "claude",
    });

    expect(result.isError).toBeFalsy();

    const entries = readAuditEntries(process.env.AUDIT_LOG_PATH!);
    const recoveryEntries = entries.filter((e) => e.event_key === "email_reconcile_recovery");

    expect(recoveryEntries.length).toBeGreaterThanOrEqual(1);
    expect(recoveryEntries[0].message_id).toBe("stale-msg-1");
    expect(typeof recoveryEntries[0].reason).toBe("string");
    expect((recoveryEntries[0].reason as string).length).toBeGreaterThan(0);
  });

  // TC-R4: dry-run emits no email_reconcile_recovery events
  it("TC-R4: dry-run reconcile emits no email_reconcile_recovery event", async () => {
    const stub = buildReconcileStub();
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    await handleGmailTool("gmail_reconcile_in_progress", {
      dryRun: true,
      staleHours: 1,
      limit: 10,
      actor: "claude",
    });

    const entries = readAuditEntries(process.env.AUDIT_LOG_PATH!);
    const recoveryEntries = entries.filter((e) => e.event_key === "email_reconcile_recovery");
    expect(recoveryEntries).toHaveLength(0);
  });
});
