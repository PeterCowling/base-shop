/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, setLockStore } from "../tools/gmail";
import { createLockStore } from "../utils/lock-store";

import { createHeader, encodeBase64Url } from "./fixtures/email/sample-threads";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

// Redirect audit log and lock store writes to a temp directory for isolation.
let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-draft-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

type GmailLabel = { id: string; name: string };

function buildGmailStub({
  labels,
  originalMessage,
}: {
  labels: GmailLabel[];
  originalMessage: {
    id: string;
    threadId: string;
    payload: { headers: { name: string; value: string }[] };
  };
}) {
  const labelsStore = [...labels];
  let labelCounter = labelsStore.length + 1;
  let draftCounter = 1;
  const draftStore: Array<{ id: string; raw?: string; messageId?: string }> = [];

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
        get: jest.fn(async () => ({
          data: originalMessage,
        })),
        modify: jest.fn(async () => ({ data: {} })),
        list: jest.fn(async () => ({ data: { messages: [] } })),
      },
      threads: {
        get: jest.fn(async () => ({ data: { messages: [] } })),
      },
      drafts: {
        create: jest.fn(async ({ requestBody }: { requestBody: { message?: { raw?: string; threadId?: string } } }) => {
          const draftId = `draft-${draftCounter++}`;
          const messageId = `draft-msg-${draftId}`;
          draftStore.push({ id: draftId, raw: requestBody.message?.raw, messageId });
          return {
            data: {
              id: draftId,
              message: { id: messageId },
            },
          };
        }),
      },
    },
  };

  return { gmail, labelsStore, draftStore };
}

describe("gmail_create_draft", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-03: create_draft with valid input -> draft created, labels applied, audit logged
  it("creates a draft reply threaded with the original email", async () => {
    const readyForReview = { id: "label-review", name: "Brikette/Drafts/Ready-For-Review" };

    const { gmail, draftStore } = buildGmailStub({
      labels: [readyForReview],
      originalMessage: {
        id: "msg-orig-1",
        threadId: "thread-orig-1",
        payload: {
          headers: [
            createHeader("From", "Guest <guest@example.com>"),
            createHeader("Message-ID", "<original-msg-id@gmail.com>"),
            createHeader("References", ""),
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_create_draft", {
      emailId: "msg-orig-1",
      subject: "RE: Check-in question",
      bodyPlain: "Hello! Check-in is at 3pm.",
    });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.success).toBe(true);
    expect(payload.draftId).toBe("draft-1");
    expect(payload.threadId).toBe("thread-orig-1");
    expect(payload.message).toContain("Draft created");
    expect(gmail.users.drafts.create).toHaveBeenCalledTimes(1);
    expect(draftStore).toHaveLength(1);

    // Verify the draft was threaded
    const draftCreateCall = gmail.users.drafts.create.mock.calls[0][0];
    expect(draftCreateCall.requestBody.message.threadId).toBe("thread-orig-1");
  });

  // TC-04: create_draft applies Ready-For-Review label to the draft message
  it("applies Ready-For-Review label to the draft message", async () => {
    const readyForReview = { id: "label-review", name: "Brikette/Drafts/Ready-For-Review" };

    const { gmail } = buildGmailStub({
      labels: [readyForReview],
      originalMessage: {
        id: "msg-orig-2",
        threadId: "thread-orig-2",
        payload: {
          headers: [
            createHeader("From", "Guest <guest@example.com>"),
            createHeader("Message-ID", "<msg-id-2@gmail.com>"),
            createHeader("References", ""),
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_create_draft", {
      emailId: "msg-orig-2",
      subject: "RE: Reservation",
      bodyPlain: "Your reservation is confirmed.",
    });

    // messages.modify should be called to apply the Ready-For-Review label to the draft message
    expect(gmail.users.messages.modify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "me",
        id: expect.stringContaining("draft-msg-"),
        requestBody: expect.objectContaining({
          addLabelIds: expect.arrayContaining([readyForReview.id]),
        }),
      })
    );
  });

  // TC-05: create_draft with API error propagates error with context
  it("propagates API error when drafts.create fails", async () => {
    const { gmail } = buildGmailStub({
      labels: [],
      originalMessage: {
        id: "msg-orig-3",
        threadId: "thread-orig-3",
        payload: {
          headers: [
            createHeader("From", "Guest <guest@example.com>"),
            createHeader("Message-ID", "<msg-id-3@gmail.com>"),
            createHeader("References", ""),
          ],
        },
      },
    });
    gmail.users.drafts.create.mockRejectedValue(new Error("Gmail API quota exceeded"));
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_create_draft", {
      emailId: "msg-orig-3",
      subject: "RE: Test",
      bodyPlain: "Response body.",
    });

    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("quota exceeded");
  });

  // TC-06: create_draft writes telemetry event to audit log
  it("writes telemetry event to the audit log after draft creation", async () => {
    const auditLogPath = path.join(_globalTmpDir, "email-audit-log.jsonl");
    // Clear existing log
    fs.writeFileSync(auditLogPath, "");

    const { gmail } = buildGmailStub({
      labels: [],
      originalMessage: {
        id: "msg-orig-4",
        threadId: "thread-orig-4",
        payload: {
          headers: [
            createHeader("From", "Guest <guest@example.com>"),
            createHeader("Message-ID", "<msg-id-4@gmail.com>"),
            createHeader("References", ""),
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_create_draft", {
      emailId: "msg-orig-4",
      subject: "RE: Audit test",
      bodyPlain: "This should be logged.",
    });

    // Read the audit log and check for the telemetry event
    const logContent = fs.readFileSync(auditLogPath, "utf8");
    const events = logContent
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));

    const draftEvent = events.find(
      (e: { event_key?: string }) => e.event_key === "email_draft_created"
    );
    expect(draftEvent).toBeDefined();
    expect(draftEvent.message_id).toBe("msg-orig-4");
    expect(draftEvent.tool_name).toBe("gmail_create_draft");
  });

  // TC-07: create_draft with missing required fields returns validation error
  it("returns validation error when required fields are missing", async () => {
    const { gmail } = buildGmailStub({
      labels: [],
      originalMessage: {
        id: "msg-orig-5",
        threadId: "thread-orig-5",
        payload: { headers: [] },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // Missing subject and bodyPlain
    const result = await handleGmailTool("gmail_create_draft", {
      emailId: "msg-orig-5",
    });

    expect(result).toHaveProperty("isError", true);
  });

  // TC-08: create_draft includes In-Reply-To and References headers
  it("builds correct References header chain from original message", async () => {
    const { gmail, draftStore } = buildGmailStub({
      labels: [],
      originalMessage: {
        id: "msg-orig-6",
        threadId: "thread-orig-6",
        payload: {
          headers: [
            createHeader("From", "Guest <guest@example.com>"),
            createHeader("Message-ID", "<new-msg@gmail.com>"),
            createHeader("References", "<old-msg@gmail.com>"),
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_create_draft", {
      emailId: "msg-orig-6",
      subject: "RE: Chain test",
      bodyPlain: "Reply in chain.",
    });

    expect(draftStore).toHaveLength(1);
    expect(draftStore[0].raw).toBeDefined();

    // Decode the raw email to verify References header is present
    const rawDecoded = Buffer.from(
      draftStore[0].raw!.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    expect(rawDecoded).toContain("References:");
    expect(rawDecoded).toContain("<old-msg@gmail.com>");
    expect(rawDecoded).toContain("<new-msg@gmail.com>");
  });

  // TC-09: create_draft gracefully handles label application failure
  it("succeeds even when label application to draft fails", async () => {
    const readyForReview = { id: "label-review", name: "Brikette/Drafts/Ready-For-Review" };

    const { gmail } = buildGmailStub({
      labels: [readyForReview],
      originalMessage: {
        id: "msg-orig-7",
        threadId: "thread-orig-7",
        payload: {
          headers: [
            createHeader("From", "Guest <guest@example.com>"),
            createHeader("Message-ID", "<msg-id-7@gmail.com>"),
            createHeader("References", ""),
          ],
        },
      },
    });
    // Label application fails
    gmail.users.messages.modify.mockRejectedValue(new Error("Label not found"));
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_create_draft", {
      emailId: "msg-orig-7",
      subject: "RE: Label fail test",
      bodyPlain: "Should still succeed.",
    });
    const payload = JSON.parse(result.content[0].text);

    // Draft creation should still succeed despite label failure
    expect(payload.success).toBe(true);
    expect(payload.draftId).toBeDefined();
  });
});
