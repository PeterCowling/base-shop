/** @jest-environment node */

/**
 * TC-E1: LOCAL cleanupInProgress (gmail.ts:2721) error-path lock-released entry
 *         carries error_reason field. Triggered by messages.modify throwing during
 *         the LOCAL handleMarkProcessed path (gmail.ts:2969 → gmail.ts:2979 →
 *         gmail.ts:2740 catch).
 *
 * TC-E2: CANONICAL cleanupInProgress (gmail-shared.ts:718) error-path lock-released
 *         entry carries error_reason field. Exercised by calling cleanupInProgress
 *         directly with a mock that throws on messages.modify.
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="gmail-error-reason"
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, REQUIRED_LABELS, setLockStore } from "../tools/gmail";
import {
  cleanupInProgress,
  setLockStore as setSharedLockStore,
} from "../tools/gmail-shared";
import { createLockStore } from "../utils/lock-store";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "error-reason-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  const lockStore = createLockStore(path.join(_globalTmpDir, "locks"));
  setLockStore(lockStore);
  setSharedLockStore(lockStore);
});
afterAll(() => {
  const restoreLock = createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-restore-")));
  setLockStore(restoreLock);
  setSharedLockStore(restoreLock);
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

function readAuditEntries(logPath: string): Array<Record<string, unknown>> {
  if (!fs.existsSync(logPath)) return [];
  return fs
    .readFileSync(logPath, "utf-8")
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}

describe("cleanupInProgress error_reason (TASK-02)", () => {
  // TC-E1: LOCAL path — gmail.ts:2721 via gmail.ts:2979
  it("TC-E1: lock-released audit entry has error_reason when LOCAL cleanupInProgress catch fires", async () => {
    const requiredLabelsWithIds = REQUIRED_LABELS.map((name, i) => ({
      id: `label-${i + 1}`,
      name,
    }));
    const stub = {
      users: {
        labels: {
          list: jest.fn(async () => ({ data: { labels: requiredLabelsWithIds } })),
          create: jest.fn(),
        },
        messages: {
          get: jest.fn(async () => ({
            data: {
              id: "msg-e1",
              labelIds: [],
              internalDate: String(Date.now()),
              payload: { headers: [] },
            },
          })),
          // Always throw so both handleMarkProcessed and cleanupInProgress fail
          modify: jest.fn().mockRejectedValue(new Error("Gmail API quota exceeded")),
          list: jest.fn(async () => ({ data: { messages: [] } })),
        },
        threads: { get: jest.fn(async () => ({ data: { messages: [] } })) },
        drafts: {
          list: jest.fn(async () => ({ data: { drafts: [] } })),
          create: jest.fn(),
        },
      },
    };
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    // Calling gmail_mark_processed with modify throwing triggers LOCAL cleanupInProgress
    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-e1",
      action: "drafted",
      actor: "codex",
    });

    const entries = readAuditEntries(process.env.AUDIT_LOG_PATH!);
    const lockReleasedEntries = entries.filter((e) => e.action === "lock-released");
    expect(lockReleasedEntries.length).toBeGreaterThanOrEqual(1);

    const errorEntry = lockReleasedEntries.find(
      (e) => typeof e.error_reason === "string" && (e.error_reason as string).length > 0,
    );
    expect(errorEntry).toBeDefined();
    expect(errorEntry?.error_reason).toContain("Gmail API quota exceeded");
  });

  // TC-E2: CANONICAL path — gmail-shared.ts:718 called directly
  it("TC-E2: lock-released audit entry has error_reason when CANONICAL cleanupInProgress catch fires", async () => {
    const requiredLabelsWithIds = REQUIRED_LABELS.map((name, i) => ({
      id: `label-${i + 1}`,
      name,
    }));
    const stub = {
      users: {
        labels: {
          list: jest.fn(async () => ({ data: { labels: requiredLabelsWithIds } })),
          create: jest.fn(),
        },
        messages: {
          modify: jest.fn().mockRejectedValue(new Error("Network timeout")),
        },
      },
    } as Parameters<typeof cleanupInProgress>[1];

    // Directly invoke the CANONICAL cleanupInProgress from gmail-shared.ts
    const result = await cleanupInProgress("msg-e2", stub);
    expect(result).toContain("cleanup failed");

    const entries = readAuditEntries(process.env.AUDIT_LOG_PATH!);
    const lockReleasedEntries = entries.filter((e) => e.action === "lock-released");
    expect(lockReleasedEntries.length).toBeGreaterThanOrEqual(1);

    const errorEntry = lockReleasedEntries.find(
      (e) => typeof e.error_reason === "string" && (e.error_reason as string).length > 0,
    );
    expect(errorEntry).toBeDefined();
    expect(errorEntry?.error_reason).toContain("Network timeout");
  });
});
