/** @jest-environment node */

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

// Hardcoded legacy label values matching LEGACY_LABELS in gmail.ts (not exported).
const KNOWN_LEGACY_LABEL_VALUES = [
  "Brikette/Inbox/Needs-Processing",
  "Brikette/Inbox/Processing",
  "Brikette/Inbox/Awaiting-Agreement",
  "Brikette/Inbox/Deferred",
  "Brikette/Processed/Drafted",
  "Brikette/Processed/Acknowledged",
  "Brikette/Processed/Skipped",
  "Brikette/Promotional",
  "Brikette/Spam",
];

let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cleanup-labels-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

type LabelEntry = { id: string; name: string };

/**
 * Build a Gmail stub with configurable message counts per label.
 * @param labelNames All label names to register.
 * @param labelMessageCounts Map of label ID -> message count (default 0).
 */
function buildCleanupStub(
  labelNames: string[],
  labelMessageCounts: Record<string, number> = {},
) {
  const labels: LabelEntry[] = labelNames.map((name, i) => ({
    id: `label-${i + 1}`,
    name,
  }));

  // Build a reverse lookup: label ID -> count.
  const idToCount = new Map<string, number>();
  for (const label of labels) {
    const count = labelMessageCounts[label.id] ?? 0;
    idToCount.set(label.id, count);
  }

  return {
    labels,
    stub: {
      users: {
        labels: {
          list: jest.fn(async () => ({ data: { labels } })),
          create: jest.fn(),
          delete: jest.fn(async () => ({})),
        },
        messages: {
          get: jest.fn(),
          modify: jest.fn(),
          list: jest.fn(async ({ labelIds }: { labelIds?: string[] }) => {
            const requestedId = labelIds?.[0] ?? "";
            const count = idToCount.get(requestedId) ?? 0;
            const messages = count > 0
              ? Array.from({ length: count }, (_, i) => ({ id: `msg-${requestedId}-${i}` }))
              : [];
            return { data: { messages } };
          }),
        },
        threads: {
          get: jest.fn(async () => ({ data: { messages: [] } })),
        },
        drafts: {
          list: jest.fn(async () => ({ data: { drafts: [] } })),
          create: jest.fn(),
        },
      },
    },
  };
}

/** Parse the JSON result from a tool call. */
function parseResult<T>(result: { content: Array<{ text: string }> }): T {
  return JSON.parse(result.content[0].text) as T;
}

type CleanupResult = {
  success: boolean;
  dryRun: boolean;
  includeLegacy: boolean;
  deleted: Array<{ name: string; id: string }>;
  skipped: Array<{ name: string; id: string; reason: string }>;
  errors: Array<{ name: string; id: string; error: string }>;
};

describe("gmail_cleanup_labels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-01: Dry-run with orphaned labels present
  it("TC-01: dry-run reports orphaned labels without deleting", async () => {
    const orphaned1 = "Brikette/Unknown/OldLabel1";
    const orphaned2 = "Brikette/Unknown/OldLabel2";
    const { stub } = buildCleanupStub([
      "Brikette",
      ...REQUIRED_LABELS,
      orphaned1,
      orphaned2,
    ]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", { dryRun: true });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    expect(content.success).toBe(true);
    expect(content.dryRun).toBe(true);
    expect(content.deleted).toHaveLength(2);
    expect(content.deleted.map((d: { name: string }) => d.name)).toEqual(
      expect.arrayContaining([orphaned1, orphaned2]),
    );
    // No actual delete calls in dry-run mode.
    expect(stub.users.labels.delete).not.toHaveBeenCalled();
  });

  // TC-02: Live run with orphaned labels (zero messages)
  it("TC-02: live run deletes orphaned labels with zero messages", async () => {
    const orphaned1 = "Brikette/Unknown/OldLabel1";
    const { stub } = buildCleanupStub([
      "Brikette",
      ...REQUIRED_LABELS,
      orphaned1,
    ]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", { dryRun: false });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    expect(content.success).toBe(true);
    expect(content.dryRun).toBe(false);
    expect(content.deleted).toHaveLength(1);
    expect(content.deleted[0].name).toBe(orphaned1);
    expect(stub.users.labels.delete).toHaveBeenCalledTimes(1);
  });

  // TC-03: Orphaned label has messages → skipped
  it("TC-03: skips orphaned labels that have associated messages", async () => {
    const orphanedWithMessages = "Brikette/Unknown/HasMessages";
    const { labels, stub } = buildCleanupStub([
      "Brikette",
      ...REQUIRED_LABELS,
      orphanedWithMessages,
    ]);
    // Find the label ID for the orphaned label and give it messages.
    const orphanedLabel = labels.find((l) => l.name === orphanedWithMessages)!;

    // Override messages.list to return messages for this specific label.
    stub.users.messages.list.mockImplementation(
      async ({ labelIds }: { labelIds?: string[] }) => {
        if (labelIds?.[0] === orphanedLabel.id) {
          return { data: { messages: [{ id: "msg-1" }] } };
        }
        return { data: { messages: [] } };
      },
    );
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", { dryRun: false });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    expect(content.deleted).toHaveLength(0);
    expect(content.skipped).toHaveLength(1);
    expect(content.skipped[0].name).toBe(orphanedWithMessages);
    expect(content.skipped[0].reason).toBe("has_messages");
    expect(stub.users.labels.delete).not.toHaveBeenCalled();
  });

  // TC-04: No orphaned labels present
  it("TC-04: no orphaned labels → empty results", async () => {
    const { stub } = buildCleanupStub(["Brikette", ...REQUIRED_LABELS]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", { dryRun: false });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    expect(content.success).toBe(true);
    expect(content.deleted).toHaveLength(0);
    expect(content.skipped).toHaveLength(0);
    expect(content.errors).toHaveLength(0);
  });

  // TC-05: includeLegacy with empty legacy labels → deleted
  it("TC-05: includeLegacy deletes empty legacy labels", async () => {
    const legacyLabel = KNOWN_LEGACY_LABEL_VALUES[0];
    const { stub } = buildCleanupStub([
      "Brikette",
      ...REQUIRED_LABELS,
      legacyLabel,
    ]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", {
      dryRun: false,
      includeLegacy: true,
    });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    expect(content.includeLegacy).toBe(true);
    expect(content.deleted).toHaveLength(1);
    expect(content.deleted[0].name).toBe(legacyLabel);
    expect(stub.users.labels.delete).toHaveBeenCalledTimes(1);
  });

  // TC-06: includeLegacy with legacy labels that have messages → skipped
  it("TC-06: includeLegacy skips legacy labels with messages", async () => {
    const legacyLabel = KNOWN_LEGACY_LABEL_VALUES[0];
    const { labels, stub } = buildCleanupStub([
      "Brikette",
      ...REQUIRED_LABELS,
      legacyLabel,
    ]);
    const legacyLabelEntry = labels.find((l) => l.name === legacyLabel)!;
    stub.users.messages.list.mockImplementation(
      async ({ labelIds }: { labelIds?: string[] }) => {
        if (labelIds?.[0] === legacyLabelEntry.id) {
          return { data: { messages: [{ id: "msg-legacy" }] } };
        }
        return { data: { messages: [] } };
      },
    );
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", {
      dryRun: false,
      includeLegacy: true,
    });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    expect(content.deleted).toHaveLength(0);
    expect(content.skipped).toHaveLength(1);
    expect(content.skipped[0].reason).toBe("has_messages");
  });

  // TC-07: labels.delete throws for one label → error recorded, others still processed
  it("TC-07: error on one label delete does not abort batch", async () => {
    const orphaned1 = "Brikette/Unknown/WillFail";
    const orphaned2 = "Brikette/Unknown/WillSucceed";
    const { labels, stub } = buildCleanupStub([
      "Brikette",
      ...REQUIRED_LABELS,
      orphaned1,
      orphaned2,
    ]);
    const failLabel = labels.find((l) => l.name === orphaned1)!;
    stub.users.labels.delete.mockImplementation(
      async ({ id }: { id: string }) => {
        if (id === failLabel.id) {
          throw new Error("Permission denied");
        }
        return {};
      },
    );
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", { dryRun: false });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    expect(content.errors).toHaveLength(1);
    expect(content.errors[0].name).toBe(orphaned1);
    expect(content.errors[0].error).toContain("delete_failed");
    // The other label should still be deleted.
    expect(content.deleted).toHaveLength(1);
    expect(content.deleted[0].name).toBe(orphaned2);
  });

  // TC-08: Bare Brikette parent is never in deletion candidates
  it("TC-08: bare Brikette parent is never deleted even if somehow classified", async () => {
    // Only Brikette parent and one orphaned label — no required labels.
    const orphaned = "Brikette/Unknown/Orphan";
    const { stub } = buildCleanupStub(["Brikette", orphaned]);
    getGmailClientMock.mockResolvedValue({ success: true, client: stub });

    const result = await handleGmailTool("gmail_cleanup_labels", { dryRun: false });

    expect(result.isError).toBeFalsy();
    const content = parseResult<CleanupResult>(result);
    // Only the orphaned label should be deleted, not Brikette.
    expect(content.deleted).toHaveLength(1);
    expect(content.deleted[0].name).toBe(orphaned);
    // Verify labels.delete was not called with the Brikette parent ID.
    const deleteCalls = stub.users.labels.delete.mock.calls as Array<[{ id: string }]>;
    const briketteId = "label-1"; // "Brikette" is the first label in the stub.
    const deletedIds = deleteCalls.map((call) => call[0].id);
    expect(deletedIds).not.toContain(briketteId);
  });
});
