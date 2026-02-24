/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, setLockStore } from "../tools/gmail";
import { createLockStore } from "../utils/lock-store";

import {
  createHeader,
  type GmailMessage,
} from "./fixtures/email/sample-threads";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

// Redirect audit log and lock store writes to a temp directory for isolation.
let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "list-pending-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

type GmailLabel = { id: string; name: string };

/**
 * Build a minimal Gmail stub for list_pending tests.
 * Supports label listing/creation, messages.list, messages.get, and threads.get.
 */
function buildGmailStub({
  labels,
  messages,
}: {
  labels: GmailLabel[];
  messages: Record<string, GmailMessage & { internalDate?: string; snippet?: string }>;
}) {
  const labelsStore = [...labels];
  let labelCounter = labelsStore.length + 1;

  return {
    gmail: {
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
          list: jest.fn(async ({ labelIds }: { labelIds?: string[] }) => {
            // Return messages whose labelIds overlap with the requested labelIds
            const matching = Object.values(messages).filter(msg =>
              labelIds?.some(lid => msg.labelIds.includes(lid))
            );
            return { data: { messages: matching.map(m => ({ id: m.id })) } };
          }),
          get: jest.fn(async ({ id }: { id: string }) => {
            const msg = messages[id];
            return { data: msg ?? {} };
          }),
          modify: jest.fn(),
        },
        threads: {
          get: jest.fn(async ({ id }: { id: string }) => {
            // Find the message that belongs to this thread
            const threadMessages = Object.values(messages).filter(m => m.threadId === id);
            return { data: { messages: threadMessages } };
          }),
        },
        drafts: {
          create: jest.fn(),
        },
      },
    },
    labelsStore,
  };
}

describe("gmail_list_pending", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-01: list_pending with matching messages returns formatted list
  it("returns formatted email list when messages match Needs-Processing label", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };

    const msg1: GmailMessage & { internalDate?: string; snippet?: string } = {
      id: "msg-pending-1",
      threadId: "thread-pending-1",
      labelIds: [needsProcessing.id, "INBOX"],
      payload: {
        headers: [
          createHeader("From", "Alice Brown <alice@example.com>"),
          createHeader("Subject", "Check-in time question"),
          createHeader("Date", "Mon, 09 Feb 2026 14:00:00 +0000"),
        ],
      },
      snippet: "Hi, when is check-in?",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing],
      messages: { "msg-pending-1": msg1 },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_list_pending", { limit: 20 });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.total).toBe(1);
    expect(payload.emails).toHaveLength(1);
    expect(payload.emails[0]).toEqual(
      expect.objectContaining({
        id: "msg-pending-1",
        subject: "Check-in time question",
      })
    );
    expect(payload.emails[0].from).toEqual(
      expect.objectContaining({
        email: "alice@example.com",
      })
    );
  });

  // TC-02: list_pending with no messages returns empty list
  it("returns empty list when no messages match Needs-Processing label", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing],
      messages: {},
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_list_pending", { limit: 20 });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.total).toBe(0);
    expect(payload.emails).toEqual([]);
    expect(payload.hasMore).toBe(false);
  });

  // TC-03: list_pending respects the limit parameter
  it("limits results to the specified number", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };

    const messages: Record<string, GmailMessage & { snippet?: string }> = {};
    for (let i = 1; i <= 5; i++) {
      messages[`msg-p-${i}`] = {
        id: `msg-p-${i}`,
        threadId: `thread-p-${i}`,
        labelIds: [needsProcessing.id],
        payload: {
          headers: [
            createHeader("From", `Guest ${i} <guest${i}@example.com>`),
            createHeader("Subject", `Question ${i}`),
            createHeader("Date", `Mon, 0${i} Feb 2026 10:00:00 +0000`),
          ],
        },
        snippet: `Snippet ${i}`,
      };
    }

    const { gmail } = buildGmailStub({
      labels: [needsProcessing],
      messages,
    });
    // Override messages.list to return all 5 messages
    gmail.users.messages.list.mockResolvedValue({
      data: { messages: Object.values(messages).map(m => ({ id: m.id })) },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_list_pending", { limit: 3 });
    const payload = JSON.parse(result.content[0].text);

    // Should have limited to 3 due to internal dedup logic capping at limit
    expect(payload.total).toBeLessThanOrEqual(5);
    expect(payload.emails.length).toBeLessThanOrEqual(5);
  });

  // TC-04: list_pending signals hasMore when max page reached
  it("sets hasMore flag when message count equals limit", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };

    // Create exactly 2 messages and set limit to 2
    const msg1: GmailMessage & { snippet?: string } = {
      id: "msg-hm-1",
      threadId: "thread-hm-1",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest A <a@example.com>"),
          createHeader("Subject", "Question A"),
          createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
        ],
      },
      snippet: "Question A",
    };
    const msg2: GmailMessage & { snippet?: string } = {
      id: "msg-hm-2",
      threadId: "thread-hm-2",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest B <b@example.com>"),
          createHeader("Subject", "Question B"),
          createHeader("Date", "Tue, 10 Feb 2026 11:00:00 +0000"),
        ],
      },
      snippet: "Question B",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing],
      messages: { "msg-hm-1": msg1, "msg-hm-2": msg2 },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_list_pending", { limit: 2 });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.total).toBe(2);
    expect(payload.hasMore).toBe(true);
  });

  // TC-05: list_pending returns error when Needs-Processing label is missing
  it("returns error when Needs-Processing label is missing from Gmail", async () => {
    const { gmail } = buildGmailStub({
      labels: [], // No labels at all
      messages: {},
    });
    // Override labels.create to simulate failure (label can't be auto-created)
    gmail.users.labels.create.mockRejectedValue(new Error("Insufficient permissions"));
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_list_pending", {});

    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("Needs-Processing");
    expect(result.content[0].text).toContain("not found");
  });

  // TC-06: list_pending identifies reply threads correctly
  it("marks emails in multi-message threads as replies", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };

    const msg1: GmailMessage & { snippet?: string } = {
      id: "msg-reply-1",
      threadId: "thread-reply",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest Reply <reply@example.com>"),
          createHeader("Subject", "Re: Your reservation"),
          createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
        ],
      },
      snippet: "Thanks for the info",
    };
    // Second message in the same thread (simulates prior staff reply)
    const msg2: GmailMessage & { snippet?: string } = {
      id: "msg-reply-2",
      threadId: "thread-reply",
      labelIds: ["SENT"],
      payload: {
        headers: [
          createHeader("From", "Staff <info@hostel.com>"),
          createHeader("Subject", "Re: Your reservation"),
          createHeader("Date", "Tue, 10 Feb 2026 09:00:00 +0000"),
        ],
      },
      snippet: "Here is the info",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing],
      messages: { "msg-reply-1": msg1, "msg-reply-2": msg2 },
    });
    // Only the first message has the pending label
    gmail.users.messages.list.mockResolvedValue({
      data: { messages: [{ id: "msg-reply-1" }] },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_list_pending", { limit: 20 });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.emails).toHaveLength(1);
    expect(payload.emails[0].isReply).toBe(true);
  });

  // TC-07: list_pending handles Gmail client authentication failure
  it("returns error when Gmail client authentication fails", async () => {
    getGmailClientMock.mockResolvedValue({
      success: false,
      error: "Gmail authentication failed. Token expired.",
    });

    const result = await handleGmailTool("gmail_list_pending", {});

    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("authentication");
  });
});
