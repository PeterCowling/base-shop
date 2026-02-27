/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, setLockStore } from "../tools/gmail";
import { createLockStore } from "../utils/lock-store";

import { createHeader, type GmailMessage } from "./fixtures/email/sample-threads";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

type GmailLabel = { id: string; name: string };

// Redirect audit log and lock store writes to a temp directory for isolation.
let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mark-processed-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

function buildGmailStub({
  labels,
  messages,
}: {
  labels: GmailLabel[];
  messages: Record<string, GmailMessage & { internalDate?: string }>;
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
        get: jest.fn(async () => ({ data: { messages: [] } })),
      },
      drafts: {
        create: jest.fn(),
      },
    },
  };

  return { gmail, messageStore, labelsStore };
}

/** Standard label set used across most tests */
function standardLabels(): GmailLabel[] {
  return [
    { id: "label-needs", name: "Brikette/Queue/Needs-Processing" },
    { id: "label-processing", name: "Brikette/Queue/In-Progress" },
    { id: "label-deferred", name: "Brikette/Queue/Deferred" },
    { id: "label-awaiting", name: "Brikette/Queue/Needs-Decision" },
    { id: "label-drafted", name: "Brikette/Outcome/Drafted" },
    { id: "label-acknowledged", name: "Brikette/Outcome/Acknowledged" },
    { id: "label-skipped", name: "Brikette/Outcome/Skipped" },
    { id: "label-promotional", name: "Brikette/Outcome/Promotional" },
    { id: "label-spam", name: "Brikette/Outcome/Spam" },
    { id: "label-chase-1", name: "Brikette/Workflow/Prepayment-Chase-1" },
    { id: "label-chase-2", name: "Brikette/Workflow/Prepayment-Chase-2" },
    { id: "label-chase-3", name: "Brikette/Workflow/Prepayment-Chase-3" },
    { id: "label-agree-received", name: "Brikette/Workflow/Agreement-Received" },
    { id: "label-agent-codex", name: "Brikette/Agent/Codex" },
    { id: "label-agent-claude", name: "Brikette/Agent/Claude" },
    { id: "label-agent-human", name: "Brikette/Agent/Human" },
  ];
}

function makeMessage(
  id: string,
  labelIds: string[],
  overrides?: Partial<GmailMessage & { internalDate?: string }>
): GmailMessage & { internalDate?: string } {
  return {
    id,
    threadId: `thread-${id}`,
    labelIds: [...labelIds],
    internalDate: String(Date.now()),
    payload: { headers: [] },
    ...overrides,
  };
}

describe("gmail_mark_processed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-06a: mark_processed with action "drafted" -> Outcome/Drafted label applied
  it("applies Outcome/Drafted label and removes queue labels for action 'drafted'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-drafted", ["label-processing"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-drafted": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-drafted",
      action: "drafted",
    });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.success).toBe(true);
    expect(payload.action).toBe("drafted");
    expect(messageStore["msg-mp-drafted"].labelIds).toContain("label-drafted");
    expect(messageStore["msg-mp-drafted"].labelIds).not.toContain("label-processing");
    expect(messageStore["msg-mp-drafted"].labelIds).not.toContain("label-needs");
  });

  // TC-06b: mark_processed with action "skipped" -> Outcome/Skipped label applied
  it("applies Outcome/Skipped label for action 'skipped'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-skipped", ["label-processing"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-skipped": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-skipped",
      action: "skipped",
    });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.success).toBe(true);
    expect(messageStore["msg-mp-skipped"].labelIds).toContain("label-skipped");
    expect(messageStore["msg-mp-skipped"].labelIds).not.toContain("label-processing");
  });

  // TC-06c: mark_processed with action "spam" -> Outcome/Spam + SPAM system label
  it("applies Outcome/Spam and system SPAM label for action 'spam'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-spam", ["label-processing"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-spam": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-spam",
      action: "spam",
    });

    expect(messageStore["msg-mp-spam"].labelIds).toContain("label-spam");
    expect(messageStore["msg-mp-spam"].labelIds).toContain("SPAM");
    expect(messageStore["msg-mp-spam"].labelIds).not.toContain("label-processing");
  });

  // TC-06d: mark_processed with action "deferred" -> Queue/Deferred label applied
  it("applies Queue/Deferred label and removes other queue labels for action 'deferred'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-deferred", ["label-needs", "label-processing", "INBOX"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-deferred": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-deferred",
      action: "deferred",
    });

    expect(messageStore["msg-mp-deferred"].labelIds).toContain("label-deferred");
    expect(messageStore["msg-mp-deferred"].labelIds).not.toContain("label-needs");
    expect(messageStore["msg-mp-deferred"].labelIds).not.toContain("label-processing");
  });

  // TC-06e: mark_processed with action "requeued" -> Queue/Needs-Processing label applied
  it("moves email back to Needs-Processing queue for action 'requeued'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-requeued", ["label-deferred", "label-processing"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-requeued": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-requeued",
      action: "requeued",
    });

    expect(messageStore["msg-mp-requeued"].labelIds).toContain("label-needs");
    expect(messageStore["msg-mp-requeued"].labelIds).not.toContain("label-deferred");
    expect(messageStore["msg-mp-requeued"].labelIds).not.toContain("label-processing");
  });

  // TC-06f: mark_processed with action "acknowledged" -> Outcome/Acknowledged label applied
  it("applies Outcome/Acknowledged label for action 'acknowledged'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-ack", ["label-processing"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-ack": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-ack",
      action: "acknowledged",
    });

    expect(messageStore["msg-mp-ack"].labelIds).toContain("label-acknowledged");
    expect(messageStore["msg-mp-ack"].labelIds).not.toContain("label-processing");
  });

  // TC-06g: mark_processed with action "promotional" -> Outcome/Promotional, INBOX removed
  it("applies Promotional label and removes INBOX for action 'promotional'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-promo", ["label-processing", "INBOX"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-promo": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-promo",
      action: "promotional",
    });

    expect(messageStore["msg-mp-promo"].labelIds).toContain("label-promotional");
    expect(messageStore["msg-mp-promo"].labelIds).not.toContain("INBOX");
    expect(messageStore["msg-mp-promo"].labelIds).not.toContain("label-processing");
  });

  // TC-06h: mark_processed with action "awaiting_agreement" -> Needs-Decision label applied
  it("applies Needs-Decision label for action 'awaiting_agreement'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-await", ["label-processing"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-await": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-await",
      action: "awaiting_agreement",
    });

    expect(messageStore["msg-mp-await"].labelIds).toContain("label-awaiting");
    expect(messageStore["msg-mp-await"].labelIds).not.toContain("label-processing");
  });

  // TC-06i: mark_processed with action "agreement_received" (no reservationCode) -> labels only, no Firebase
  it("applies Needs-Decision and Agreement-Received labels for action 'agreement_received'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-agree", ["label-awaiting"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-agree": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // global.fetch is undefined in this node test environment; assign a mock to detect if it's called
    const fetchMock = jest.fn();
    (global as unknown as Record<string, unknown>).fetch = fetchMock;

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-agree",
      action: "agreement_received",
    });

    expect(messageStore["msg-mp-agree"].labelIds).toContain("label-awaiting");
    expect(messageStore["msg-mp-agree"].labelIds).toContain("label-agree-received");
    // No reservationCode → no Firebase calls
    expect(fetchMock).not.toHaveBeenCalled();

    delete (global as unknown as Record<string, unknown>).fetch;
  });

  // TC-06i-b: mark_processed with action "agreement_received" + reservationCode -> Firebase writes code 21
  it("writes activity code 21 to Firebase fanout paths when reservationCode is provided", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-agree-b", ["label-awaiting"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-agree-b": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    process.env.FIREBASE_DATABASE_URL = "https://test-db.firebaseio.com";
    const fetchMock = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("/bookings/RES-42")) {
        return { ok: true, json: async () => ({ occ1: true, occ2: true }) } as Response;
      }
      return { ok: true, json: async () => null } as Response;
    });
    (global as unknown as Record<string, unknown>).fetch = fetchMock;

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-agree-b",
      action: "agreement_received",
      reservationCode: "RES-42",
    });

    expect(messageStore["msg-mp-agree-b"].labelIds).toContain("label-agree-received");

    const fetchUrls = (fetchMock.mock.calls as [RequestInfo | URL][]).map((c) => {
      const input = c[0];
      return typeof input === "string" ? input : (input as Request).url;
    });
    expect(fetchUrls.some((u) => u.includes("/bookings/RES-42"))).toBe(true);
    expect(fetchUrls.some((u) => u.includes("/activities/occ1/"))).toBe(true);
    expect(fetchUrls.some((u) => u.includes("/activitiesByCode/21/occ1/"))).toBe(true);
    expect(fetchUrls.some((u) => u.includes("/activities/occ2/"))).toBe(true);
    expect(fetchUrls.some((u) => u.includes("/activitiesByCode/21/occ2/"))).toBe(true);

    delete (global as unknown as Record<string, unknown>).fetch;
    delete process.env.FIREBASE_DATABASE_URL;
  });

  // TC-06i-c: agreement_received + reservationCode but Firebase fails -> graceful degradation, labels still applied
  it("applies labels even when Firebase write fails for agreement_received", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-agree-c", ["label-awaiting"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-agree-c": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    process.env.FIREBASE_DATABASE_URL = "https://test-db.firebaseio.com";
    const fetchMock = jest.fn().mockRejectedValue(new Error("Firebase unavailable"));
    (global as unknown as Record<string, unknown>).fetch = fetchMock;

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-agree-c",
      action: "agreement_received",
      reservationCode: "RES-99",
    });

    // Labels must still be applied despite Firebase failure
    expect(messageStore["msg-mp-agree-c"].labelIds).toContain("label-agree-received");

    delete (global as unknown as Record<string, unknown>).fetch;
    delete process.env.FIREBASE_DATABASE_URL;
  });

  // TC-06j: mark_processed with prepayment chase actions -> correct workflow labels
  it("applies prepayment chase labels with Needs-Decision for action 'prepayment_chase_1'", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-chase1", ["label-awaiting"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-chase1": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-chase1",
      action: "prepayment_chase_1",
    });

    expect(messageStore["msg-mp-chase1"].labelIds).toContain("label-chase-1");
    expect(messageStore["msg-mp-chase1"].labelIds).toContain("label-awaiting");
    // Previous chase labels should be removed
    expect(messageStore["msg-mp-chase1"].labelIds).not.toContain("label-chase-2");
    expect(messageStore["msg-mp-chase1"].labelIds).not.toContain("label-chase-3");
  });

  // TC-06k: mark_processed escalates chase labels correctly
  it("replaces chase-1 with chase-2 when escalating prepayment chase", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-chase2", ["label-awaiting", "label-chase-1"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-chase2": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-chase2",
      action: "prepayment_chase_2",
    });

    expect(messageStore["msg-mp-chase2"].labelIds).toContain("label-chase-2");
    expect(messageStore["msg-mp-chase2"].labelIds).toContain("label-awaiting");
    expect(messageStore["msg-mp-chase2"].labelIds).not.toContain("label-chase-1");
  });

  // TC-07: mark_processed with invalid action -> error
  it("returns validation error for invalid action", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-invalid", ["label-processing"]);
    const { gmail } = buildGmailStub({ labels, messages: { "msg-mp-invalid": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-invalid",
      action: "nonexistent_action",
    });

    expect(result).toHaveProperty("isError", true);
  });

  // TC-08: mark_processed releases processing lock and writes audit entries
  it("releases processing lock and writes audit entries on success", async () => {
    const auditLogPath = path.join(_globalTmpDir, "email-audit-log.jsonl");
    fs.writeFileSync(auditLogPath, "");

    const labels = standardLabels();
    const msg = makeMessage("msg-mp-audit", ["label-processing"]);
    const { gmail } = buildGmailStub({ labels, messages: { "msg-mp-audit": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-audit",
      action: "drafted",
    });

    const logContent = fs.readFileSync(auditLogPath, "utf8");
    const entries = logContent
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));

    // Should have lock-released entry
    const lockReleased = entries.find(
      (e: { action?: string; messageId?: string }) =>
        e.action === "lock-released" && e.messageId === "msg-mp-audit"
    );
    expect(lockReleased).toBeDefined();

    // Should have outcome entry
    const outcomeEntry = entries.find(
      (e: { action?: string; messageId?: string }) =>
        e.action === "outcome" && e.messageId === "msg-mp-audit"
    );
    expect(outcomeEntry).toBeDefined();
    expect(outcomeEntry.result).toBe("drafted");
  });

  // TC-09: mark_processed applies actor label
  it("applies the correct actor label", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-actor", ["label-processing"]);
    const { gmail, messageStore } = buildGmailStub({ labels, messages: { "msg-mp-actor": msg } });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-actor",
      action: "drafted",
      actor: "claude",
    });

    expect(messageStore["msg-mp-actor"].labelIds).toContain("label-agent-claude");
    expect(messageStore["msg-mp-actor"].labelIds).not.toContain("label-agent-codex");
    expect(messageStore["msg-mp-actor"].labelIds).not.toContain("label-agent-human");
  });

  // TC-10: mark_processed with API error triggers cleanup
  it("attempts In-Progress cleanup when label application fails", async () => {
    const labels = standardLabels();
    const msg = makeMessage("msg-mp-err", ["label-processing"]);
    const { gmail } = buildGmailStub({ labels, messages: { "msg-mp-err": msg } });

    // First modify call (main) throws; subsequent calls (cleanup + pre-fetch) succeed
    let callCount = 0;
    gmail.users.messages.modify.mockImplementation(async ({ id, requestBody }: { id: string; requestBody: { addLabelIds?: string[]; removeLabelIds?: string[] } }) => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Gmail API transient failure");
      }
      return { data: { id, labelIds: [] } };
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_mark_processed", {
      emailId: "msg-mp-err",
      action: "drafted",
    });

    expect(result).toHaveProperty("isError", true);
    expect(result.content[0].text).toContain("Failed to apply labels");
    // Cleanup should have been attempted
    expect(gmail.users.messages.modify.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
