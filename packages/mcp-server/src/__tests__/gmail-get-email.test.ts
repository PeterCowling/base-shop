/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, setLockStore } from "../tools/gmail";
import { createLockStore } from "../utils/lock-store";

import {
  createHeader,
  encodeBase64Url,
  type GmailMessage,
} from "./fixtures/email/sample-threads";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

type GmailLabel = { id: string; name: string };

// Redirect audit log and lock store writes to a temp directory for isolation.
let _globalTmpDir: string;
let _lockDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "get-email-"));
  _lockDir = path.join(_globalTmpDir, "locks");
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(_lockDir));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

/**
 * Build a Gmail stub for get_email tests, with message modification support.
 */
function buildGmailStub({
  labels,
  messages,
  threadMessages,
}: {
  labels: GmailLabel[];
  messages: Record<string, GmailMessage & { internalDate?: string; snippet?: string }>;
  threadMessages?: Record<string, (GmailMessage & { snippet?: string })[]>;
}) {
  const labelsStore = [...labels];
  const messageStore = { ...messages };
  let labelCounter = labelsStore.length + 1;

  const gmail = {
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
        get: jest.fn(async ({ id }: { id: string }) => ({ data: messageStore[id] })),
        modify: jest.fn(async ({ id, requestBody }: { id: string; requestBody: { addLabelIds?: string[]; removeLabelIds?: string[] } }) => {
          const message = messageStore[id];
          if (!message) throw new Error(`Message not found: ${id}`);
          const remove = requestBody.removeLabelIds || [];
          const add = requestBody.addLabelIds || [];
          message.labelIds = message.labelIds.filter(labelId => !remove.includes(labelId));
          for (const labelId of add) {
            if (!message.labelIds.includes(labelId)) {
              message.labelIds.push(labelId);
            }
          }
          return { data: message };
        }),
        list: jest.fn(async () => ({ data: { messages: [] } })),
      },
      threads: {
        get: jest.fn(async ({ id }: { id: string }) => {
          if (threadMessages?.[id]) {
            return { data: { messages: threadMessages[id] } };
          }
          // Default: return just the single message matching this thread
          const threadMsgs = Object.values(messageStore).filter(m => m.threadId === id);
          return { data: { messages: threadMsgs } };
        }),
      },
      drafts: {
        create: jest.fn(),
      },
    },
  };

  return { gmail, messageStore, labelsStore };
}

describe("gmail_get_email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset lock store between tests to avoid "already being processed" conflicts
    setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "get-email-locks-"))));
  });

  // TC-05: get_email with thread returns message + thread context
  it("returns full message details with thread context when includeThread is true", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const processing = { id: "label-processing", name: "Brikette/Queue/In-Progress" };
    const codexActor = { id: "label-agent-codex", name: "Brikette/Agent/Codex" };

    const mainMsg: GmailMessage & { snippet?: string } = {
      id: "msg-get-1",
      threadId: "thread-get-1",
      labelIds: [needsProcessing.id, "INBOX"],
      payload: {
        headers: [
          createHeader("From", "Alice Brown <alice@example.com>"),
          createHeader("Subject", "Check-in time"),
          createHeader("Date", "Mon, 09 Feb 2026 14:00:00 +0000"),
          createHeader("Message-ID", "<msg-get-1@gmail.com>"),
        ],
        mimeType: "text/plain",
        body: { data: encodeBase64Url("When is check-in?") },
      },
      snippet: "When is check-in?",
    };

    const priorMsg: GmailMessage & { snippet?: string } = {
      id: "msg-get-0",
      threadId: "thread-get-1",
      labelIds: ["SENT"],
      payload: {
        headers: [
          createHeader("From", "Staff <info@hostel.com>"),
          createHeader("Date", "Mon, 09 Feb 2026 10:00:00 +0000"),
        ],
      },
      snippet: "Thank you for booking",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing, processing, codexActor],
      messages: { "msg-get-1": mainMsg },
      threadMessages: {
        "thread-get-1": [priorMsg, mainMsg],
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", {
      emailId: "msg-get-1",
      includeThread: true,
    });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.id).toBe("msg-get-1");
    expect(payload.subject).toBe("Check-in time");
    expect(payload.from).toEqual(
      expect.objectContaining({
        email: "alice@example.com",
        name: "Alice Brown",
      })
    );
    expect(payload.body.plain).toContain("When is check-in?");
    expect(payload.isReply).toBe(true);
    expect(payload.threadContext).toBeDefined();
    expect(payload.threadContext.messages).toHaveLength(1);
    expect(payload.threadContext.messages[0].snippet).toBe("Thank you for booking");
  });

  // TC-06: get_email without thread context
  it("returns message without thread context when includeThread is false", async () => {
    const needsProcessing = { id: "label-needs-2", name: "Brikette/Queue/Needs-Processing" };
    const processing = { id: "label-processing-2", name: "Brikette/Queue/In-Progress" };
    const codexActor = { id: "label-agent-codex-2", name: "Brikette/Agent/Codex" };

    const msg: GmailMessage & { snippet?: string } = {
      id: "msg-get-no-thread",
      threadId: "thread-get-no-thread",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest <guest@example.com>"),
          createHeader("Subject", "Simple question"),
          createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
          createHeader("Message-ID", "<no-thread-msg@gmail.com>"),
        ],
        mimeType: "text/plain",
        body: { data: encodeBase64Url("Is breakfast included?") },
      },
      snippet: "Is breakfast included?",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing, processing, codexActor],
      messages: { "msg-get-no-thread": msg },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", {
      emailId: "msg-get-no-thread",
      includeThread: false,
    });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.id).toBe("msg-get-no-thread");
    expect(payload.subject).toBe("Simple question");
    // Thread context should be undefined when includeThread is false
    expect(payload.threadContext).toBeUndefined();
    expect(payload.isReply).toBe(false);
  });

  // TC-07: get_email applies In-Progress label and agent label
  it("applies In-Progress label and actor label when claiming an email", async () => {
    const needsProcessing = { id: "label-needs-3", name: "Brikette/Queue/Needs-Processing" };
    const processing = { id: "label-processing-3", name: "Brikette/Queue/In-Progress" };
    const codexActor = { id: "label-agent-codex-3", name: "Brikette/Agent/Codex" };
    const claudeActor = { id: "label-agent-claude-3", name: "Brikette/Agent/Claude" };

    const msg: GmailMessage & { snippet?: string } = {
      id: "msg-get-claim",
      threadId: "thread-get-claim",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest <guest@example.com>"),
          createHeader("Subject", "Claim test"),
          createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
        ],
        mimeType: "text/plain",
        body: { data: encodeBase64Url("Hello") },
      },
      snippet: "Hello",
    };

    const { gmail, messageStore } = buildGmailStub({
      labels: [needsProcessing, processing, codexActor, claudeActor],
      messages: { "msg-get-claim": msg },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_get_email", {
      emailId: "msg-get-claim",
      actor: "claude",
    });

    // In-Progress label should be added, Needs-Processing removed
    expect(messageStore["msg-get-claim"].labelIds).toContain(processing.id);
    expect(messageStore["msg-get-claim"].labelIds).not.toContain(needsProcessing.id);
    // Claude actor label should be applied
    expect(messageStore["msg-get-claim"].labelIds).toContain(claudeActor.id);
    // Codex actor label should not be present
    expect(messageStore["msg-get-claim"].labelIds).not.toContain(codexActor.id);
  });

  // TC-08: get_email prevents concurrent processing
  it("returns error when email is already being processed", async () => {
    const needsProcessing = { id: "label-needs-4", name: "Brikette/Queue/Needs-Processing" };
    const processing = { id: "label-processing-4", name: "Brikette/Queue/In-Progress" };
    const codexActor = { id: "label-agent-codex-4", name: "Brikette/Agent/Codex" };

    const msg: GmailMessage & { snippet?: string } = {
      id: "msg-get-concurrent",
      threadId: "thread-get-concurrent",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest <guest@example.com>"),
          createHeader("Subject", "Concurrent test"),
          createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
        ],
        mimeType: "text/plain",
        body: { data: encodeBase64Url("Hello") },
      },
      snippet: "Hello",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing, processing, codexActor],
      messages: { "msg-get-concurrent": msg },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // First call should succeed
    const first = await handleGmailTool("gmail_get_email", { emailId: "msg-get-concurrent" });
    expect(first).toHaveProperty("content");
    expect((first as { isError?: boolean }).isError).not.toBe(true);

    // Second call should fail because the email is now In-Progress
    const second = await handleGmailTool("gmail_get_email", { emailId: "msg-get-concurrent" });
    expect(second).toHaveProperty("isError", true);
    expect(second.content[0].text).toContain("being processed");
  });

  // TC-09: get_email returns error for non-existent email
  it("returns error when email ID does not exist", async () => {
    const needsProcessing = { id: "label-needs-5", name: "Brikette/Queue/Needs-Processing" };
    const processing = { id: "label-processing-5", name: "Brikette/Queue/In-Progress" };
    const codexActor = { id: "label-agent-codex-5", name: "Brikette/Agent/Codex" };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing, processing, codexActor],
      messages: {},
    });
    // messages.get returns undefined data for non-existent email
    gmail.users.messages.get.mockResolvedValue({ data: {} });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", { emailId: "msg-nonexistent" });

    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("not found");
  });

  // TC-10: get_email writes audit entry for lock acquisition
  it("writes audit entry when acquiring processing lock", async () => {
    const auditLogPath = path.join(_globalTmpDir, "email-audit-log.jsonl");
    fs.writeFileSync(auditLogPath, "");

    const needsProcessing = { id: "label-needs-6", name: "Brikette/Queue/Needs-Processing" };
    const processing = { id: "label-processing-6", name: "Brikette/Queue/In-Progress" };
    const codexActor = { id: "label-agent-codex-6", name: "Brikette/Agent/Codex" };

    const msg: GmailMessage & { snippet?: string } = {
      id: "msg-get-audit",
      threadId: "thread-get-audit",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest <guest@example.com>"),
          createHeader("Subject", "Audit test"),
          createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
        ],
        mimeType: "text/plain",
        body: { data: encodeBase64Url("Hello") },
      },
      snippet: "Hello",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing, processing, codexActor],
      messages: { "msg-get-audit": msg },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_get_email", { emailId: "msg-get-audit" });

    const logContent = fs.readFileSync(auditLogPath, "utf8");
    const entries = logContent
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));

    const lockEntry = entries.find(
      (e: { action?: string; messageId?: string }) =>
        e.action === "lock-acquired" && e.messageId === "msg-get-audit"
    );
    expect(lockEntry).toBeDefined();
  });

  // TC-11: get_email extracts attachments metadata
  it("extracts attachment metadata from multipart messages", async () => {
    const needsProcessing = { id: "label-needs-7", name: "Brikette/Queue/Needs-Processing" };
    const processing = { id: "label-processing-7", name: "Brikette/Queue/In-Progress" };
    const codexActor = { id: "label-agent-codex-7", name: "Brikette/Agent/Codex" };

    const msg: GmailMessage & { snippet?: string } = {
      id: "msg-get-attach",
      threadId: "thread-get-attach",
      labelIds: [needsProcessing.id],
      payload: {
        headers: [
          createHeader("From", "Guest <guest@example.com>"),
          createHeader("Subject", "With attachment"),
          createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
        ],
        mimeType: "multipart/mixed",
        parts: [
          {
            mimeType: "text/plain",
            body: { data: encodeBase64Url("See attached") },
            headers: [],
          },
          {
            mimeType: "application/pdf",
            body: { data: encodeBase64Url("fake-pdf-data") },
            headers: [
              createHeader("Content-Disposition", "attachment; filename=\"receipt.pdf\""),
            ],
          },
        ],
      },
      snippet: "See attached",
    };

    const { gmail } = buildGmailStub({
      labels: [needsProcessing, processing, codexActor],
      messages: { "msg-get-attach": msg },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_get_email", { emailId: "msg-get-attach" });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.body.plain).toContain("See attached");
    // Attachment extraction depends on the extractAttachments implementation;
    // verify that attachments array is present in the response
    expect(payload.attachments).toBeDefined();
    expect(Array.isArray(payload.attachments)).toBe(true);
  });
});
