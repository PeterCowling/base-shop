/** @jest-environment node */

/**
 * TASK-03: Tests for the file-backed lock store (lock-store.ts).
 *
 * TC-03-01: acquire(messageId, owner) writes data/locks/<messageId>.json
 *           containing { lockedAt: number, owner: string }
 * TC-03-02: release(messageId) deletes the lock file
 * TC-03-03: isStale(messageId, timeoutMs) reads lockedAt from file;
 *           returns true when Date.now() - lockedAt > timeoutMs
 * TC-03-04: second acquire call with same messageId returns false
 *           (wx flag prevents double-acquisition)
 * TC-03-07: lock store is injectable via setLockStore — passing a mock
 *           store to handleGetEmail works
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="lock-store"
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, setLockStore } from "../tools/gmail";
import { createLockStore, type LockEntry, type LockStore } from "../utils/lock-store";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GmailLabel = { id: string; name: string };
type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  internalDate: string;
  payload: { headers: { name: string; value: string }[] };
  snippet?: string;
};
type GmailStub = {
  users: {
    labels: { list: jest.Mock; create: jest.Mock };
    messages: { get: jest.Mock; modify: jest.Mock; list: jest.Mock };
    threads: { get: jest.Mock; list: jest.Mock };
    drafts: { create: jest.Mock };
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGmailStub({
  labels,
  messages,
}: {
  labels?: GmailLabel[];
  messages: Record<string, GmailMessage>;
}): { gmail: GmailStub; messageStore: Record<string, GmailMessage> } {
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
          data: { messages: [] },
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
            if (!message) throw new Error(`Message not found: ${id}`);
            const remove = requestBody.removeLabelIds ?? [];
            const add = requestBody.addLabelIds ?? [];
            message.labelIds = message.labelIds.filter(l => !remove.includes(l));
            for (const labelId of add) {
              if (!message.labelIds.includes(labelId)) message.labelIds.push(labelId);
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

  return { gmail, messageStore };
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

// ---------------------------------------------------------------------------
// Test suite: lock-store unit tests
// ---------------------------------------------------------------------------

describe("lock-store (TASK-03 unit)", () => {
  let tmpDir: string;
  let store: LockStore;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-test-"));
    store = createLockStore(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // TC-03-01
  it("TC-03-01: acquire writes <messageId>.json with lockedAt and owner", () => {
    const result = store.acquire("msg-001", "claude");
    expect(result).toBe(true);

    const lockFile = path.join(tmpDir, "msg-001.json");
    expect(fs.existsSync(lockFile)).toBe(true);

    const raw = fs.readFileSync(lockFile, "utf-8");
    const entry = JSON.parse(raw) as LockEntry;
    expect(typeof entry.lockedAt).toBe("number");
    expect(entry.lockedAt).toBeGreaterThan(0);
    expect(entry.owner).toBe("claude");
  });

  // TC-03-02
  it("TC-03-02: release deletes the lock file", () => {
    store.acquire("msg-002", "codex");
    const lockFile = path.join(tmpDir, "msg-002.json");
    expect(fs.existsSync(lockFile)).toBe(true);

    store.release("msg-002");
    expect(fs.existsSync(lockFile)).toBe(false);
  });

  it("TC-03-02b: release on a non-existent lock is a no-op (no throw)", () => {
    expect(() => store.release("does-not-exist")).not.toThrow();
  });

  // TC-03-03
  it("TC-03-03: isStale returns true when lockedAt is older than timeoutMs", () => {
    // Write a lock file with a very old timestamp
    const oldLock: LockEntry = { lockedAt: Date.now() - 200_000, owner: "human" };
    fs.writeFileSync(
      path.join(tmpDir, "msg-003.json"),
      JSON.stringify(oldLock)
    );

    expect(store.isStale("msg-003", 100_000)).toBe(true);
  });

  it("TC-03-03b: isStale returns false when lockedAt is recent", () => {
    store.acquire("msg-003-fresh", "claude");
    // Timeout of 60 seconds — fresh lock is not stale
    expect(store.isStale("msg-003-fresh", 60_000)).toBe(false);
  });

  it("TC-03-03c: isStale returns false when no lock file exists (unlocked, not stale)", () => {
    expect(store.isStale("non-existent-msg", 1_000)).toBe(false);
  });

  // TC-03-04
  it("TC-03-04: second acquire for same messageId returns false (wx flag)", () => {
    const first = store.acquire("msg-004", "claude");
    const second = store.acquire("msg-004", "codex");
    expect(first).toBe(true);
    expect(second).toBe(false);

    // Lock file still belongs to first acquirer
    const entry = store.get("msg-004");
    expect(entry?.owner).toBe("claude");
  });

  it("TC-03-list: list returns messageIds with lock files", () => {
    store.acquire("alpha", "human");
    store.acquire("beta", "claude");
    const ids = store.list().sort();
    expect(ids).toEqual(["alpha", "beta"]);
  });

  it("TC-03-get: get returns null for absent or corrupt file", () => {
    expect(store.get("missing")).toBeNull();

    // Write a corrupt file
    fs.writeFileSync(path.join(tmpDir, "corrupt.json"), "NOT JSON");
    expect(store.get("corrupt")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test suite: injectable lock store via setLockStore (TC-03-07)
// ---------------------------------------------------------------------------

describe("lock-store injectable via setLockStore (TC-03-07)", () => {
  let tmpDir: string;
  let auditLogPath: string;
  const needsProcessing: GmailLabel = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
  const processing: GmailLabel = { id: "label-processing", name: "Brikette/Queue/In-Progress" };

  let originalStore: LockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-inject-"));
    auditLogPath = path.join(tmpDir, "email-audit-log.jsonl");
    process.env.AUDIT_LOG_PATH = auditLogPath;

    // Save existing store so we can restore it
    // We inject a store backed by our temp dir
    originalStore = createLockStore(tmpDir);
  });

  afterEach(() => {
    // Restore default store (fresh temp dir store — good enough for isolation)
    setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
    delete process.env.AUDIT_LOG_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // TC-03-07
  it("TC-03-07: injecting a mock lock store via setLockStore prevents handleGetEmail from acquiring when locked", async () => {
    // Set up a mock store that always reports the lock as already held
    const mockStore: LockStore = {
      acquire: jest.fn((_messageId: string, _owner: string) => false), // lock already held
      release: jest.fn(),
      get: jest.fn((_messageId: string) => ({ lockedAt: Date.now(), owner: "codex" }) as LockEntry),
      isStale: jest.fn((_messageId: string, _timeoutMs: number) => false),
      list: jest.fn(() => [] as string[]),
    };

    setLockStore(mockStore);

    const { gmail } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: {
        "msg-tc07": {
          ...makeMessage("msg-tc07"),
          // Message already has In-Progress label
          labelIds: ["label-needs", processing.id],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", {
      emailId: "msg-tc07",
      actor: "claude",
    });

    // Because the lock store reports the message as locked (isStale = false),
    // handleGetEmail should return an error saying "already being processed".
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(result.content[0].text).toContain("already being processed");
  });

  it("TC-03-07b: injecting a file-backed store allows handleGetEmail to succeed and creates a lock file", async () => {
    const fileStore = createLockStore(tmpDir);
    setLockStore(fileStore);

    const { gmail } = createGmailStub({
      labels: [needsProcessing, processing],
      messages: {
        "msg-tc07b": makeMessage("msg-tc07b"),
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", {
      emailId: "msg-tc07b",
      actor: "claude",
    });

    expect((result as { isError?: boolean }).isError).not.toBe(true);

    // The lock file should exist in our temp dir
    const lockFile = path.join(tmpDir, "msg-tc07b.json");
    expect(fs.existsSync(lockFile)).toBe(true);

    const entry = JSON.parse(fs.readFileSync(lockFile, "utf-8")) as LockEntry;
    expect(entry.owner).toBe("claude");
  });
});
