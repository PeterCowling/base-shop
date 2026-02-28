/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool, setLockStore } from "../tools/gmail";
import { sendGuestEmailActivity } from "../tools/guest-email-activity";
import { processCancellationEmail } from "../tools/process-cancellation-email";
import { createLockStore, type LockStore } from "../utils/lock-store";

type GmailLabel = { id: string; name: string };
type GmailHeader = { name: string; value: string };
type GmailPayload = {
  headers: GmailHeader[];
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
};
type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  payload: GmailPayload;
  snippet?: string;
};
type GmailThread = {
  id: string;
  messages: GmailMessage[];
};

type GmailStub = {
  users: {
    labels: {
      list: jest.Mock;
      create: jest.Mock;
    };
    threads: {
      list: jest.Mock;
      get: jest.Mock;
    };
    messages: {
      list: jest.Mock;
      modify: jest.Mock;
      get: jest.Mock;
    };
    drafts: {
      create: jest.Mock;
    };
  };
};

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

jest.mock("../tools/process-cancellation-email", () => ({
  processCancellationEmail: jest.fn(),
}));

jest.mock("../tools/guest-email-activity", () => ({
  sendGuestEmailActivity: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;
const processCancellationEmailMock = processCancellationEmail as jest.Mock;
const sendGuestEmailActivityMock = sendGuestEmailActivity as jest.Mock;

// Redirect audit log and lock store writes to a temp directory for isolation.
let _globalTmpDir: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "organize-inbox-global-"));
  process.env.AUDIT_LOG_PATH = path.join(_globalTmpDir, "email-audit-log.jsonl");
  // Inject a file-backed store in a temp dir so tests don't affect real data/locks/.
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});
beforeEach(() => {
  sendGuestEmailActivityMock.mockReset();
});

function createHeader(name: string, value: string): GmailHeader {
  return { name, value };
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function createGmailStub({
  labels,
  threads,
}: {
  labels: GmailLabel[];
  threads: Record<string, GmailThread>;
}): {
  gmail: GmailStub;
  labelsStore: GmailLabel[];
  messageStore: Record<string, GmailMessage>;
  draftStore: Array<{ id: string; raw?: string }>;
} {
  const labelsStore = [...labels];
  const threadStore = { ...threads };
  const messageStore: Record<string, GmailMessage> = {};
  const draftStore: Array<{ id: string; raw?: string }> = [];
  for (const thread of Object.values(threadStore)) {
    for (const message of thread.messages) {
      messageStore[message.id] = message;
    }
  }

  let labelCounter = labelsStore.length + 1;
  let draftCounter = 1;

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
      threads: {
        list: jest.fn(async () => ({
          data: { threads: Object.values(threadStore).map(thread => ({ id: thread.id })) },
        })),
        get: jest.fn(async ({ id }: { id: string }) => ({ data: threadStore[id] })),
      },
      messages: {
        list: jest.fn(async () => ({ data: { messages: [] } })),
        modify: jest.fn(async ({ id, requestBody }: { id: string; requestBody: { addLabelIds?: string[]; removeLabelIds?: string[] } }) => {
          const message = messageStore[id];
          if (!message) {
            throw new Error(`Message not found: ${id}`);
          }
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
        get: jest.fn(async ({ id }: { id: string }) => ({ data: messageStore[id] })),
      },
      drafts: {
        create: jest.fn(async ({ requestBody }: { requestBody: { message?: { raw?: string } } }) => {
          const draftId = `draft-${draftCounter++}`;
          draftStore.push({ id: draftId, raw: requestBody.message?.raw });
          return {
            data: {
              id: draftId,
              message: { id: `draft-message-${draftId}` },
            },
          };
        }),
      },
    },
  };

  return { gmail, labelsStore, messageStore, draftStore };
}

describe("gmail_organize_inbox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("trashes explicit garbage sender patterns", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const spam = { id: "label-spam", name: "Brikette/Outcome/Spam" };
    const { gmail, messageStore } = createGmailStub({
      labels: [needsProcessing, spam],
      threads: {
        "thread-1": {
          id: "thread-1",
          messages: [
            {
              id: "msg-1",
              threadId: "thread-1",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "promotion-it@amazon.it"),
                  createHeader("Subject", "Deal of the day"),
                  createHeader("Date", "Tue, 10 Feb 2026 10:00:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { specificStartDate: "2026-02-09" });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.trashed).toBe(1);
    expect(payload.counts.labeledNeedsProcessing).toBe(0);
    expect(messageStore["msg-1"].labelIds).toContain("TRASH");
    expect(messageStore["msg-1"].labelIds).toContain(spam.id);
    expect(messageStore["msg-1"].labelIds).not.toContain("INBOX");
  });

  it("labels customer inquiry emails as Needs-Processing", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const { gmail, messageStore } = createGmailStub({
      labels: [needsProcessing],
      threads: {
        "thread-2": {
          id: "thread-2",
          messages: [
            {
              id: "msg-2",
              threadId: "thread-2",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "\"Guest Name through Booking.com\" <123@guest.booking.com>"),
                  createHeader("Subject", "We received this message from Guest Name"),
                  createHeader("Date", "Tue, 10 Feb 2026 12:00:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { specificStartDate: "2026-02-09" });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.trashed).toBe(0);
    expect(payload.counts.labeledNeedsProcessing).toBe(1);
    expect(messageStore["msg-2"].labelIds).toContain(needsProcessing.id);
  });

  it("skips threads that already have Brikette labels", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const processed = { id: "label-processed", name: "Brikette/Outcome/Drafted" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing, processed],
      threads: {
        "thread-3": {
          id: "thread-3",
          messages: [
            {
              id: "msg-3",
              threadId: "thread-3",
              labelIds: ["INBOX", "UNREAD", processed.id],
              payload: {
                headers: [
                  createHeader("From", "guest@example.com"),
                  createHeader("Subject", "Hi, quick question"),
                  createHeader("Date", "Tue, 10 Feb 2026 13:00:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { specificStartDate: "2026-02-09" });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.skippedAlreadyManaged).toBe(1);
    expect(gmail.users.messages.modify).not.toHaveBeenCalled();
  });

  it("reports actions in dryRun mode without mutating labels", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const spam = { id: "label-spam", name: "Brikette/Outcome/Spam" };
    const { gmail, messageStore } = createGmailStub({
      labels: [needsProcessing, spam],
      threads: {
        "thread-4": {
          id: "thread-4",
          messages: [
            {
              id: "msg-4",
              threadId: "thread-4",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "groupupdates@facebookmail.com"),
                  createHeader("Subject", "Group digest"),
                  createHeader("Date", "Tue, 10 Feb 2026 14:00:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const beforeLabels = [...messageStore["msg-4"].labelIds];
    const result = await handleGmailTool("gmail_organize_inbox", {
      specificStartDate: "2026-02-09",
      dryRun: true,
    });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.dryRun).toBe(true);
    expect(payload.counts.trashed).toBe(1);
    expect(gmail.users.messages.modify).not.toHaveBeenCalled();
    expect(messageStore["msg-4"].labelIds).toEqual(beforeLabels);
  });

  // TC-06-03b: handleOrganizeInbox uses label-absence query as default (not is:unread)
  it("TC-06-03b: uses label-absence query by default (no date window)", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing],
      threads: {
        "thread-5": {
          id: "thread-5",
          messages: [
            {
              id: "msg-5",
              threadId: "thread-5",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "guest@example.com"),
                  createHeader("Subject", "Question about check-in"),
                  createHeader("Date", "Tue, 10 Feb 2026 14:30:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    // Must use label-absence query — not is:unread
    const calledWith = gmail.users.threads.list.mock.calls[0][0] as { q: string };
    expect(calledWith.q).toContain("in:inbox");
    expect(calledWith.q).toContain("newer_than:");
    expect(calledWith.q).toContain("-label:");
    expect(calledWith.q).not.toContain("is:unread");
    expect(payload.scanWindow.mode).toBe("label-absence");
  });

  // TC-06-04: dryRun mode with label-absence query returns thread count and does NOT call messages.modify
  it("TC-06-04: dryRun mode uses label-absence query and does not call messages.modify", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing],
      threads: {
        "thread-dry": {
          id: "thread-dry",
          messages: [
            {
              id: "msg-dry",
              threadId: "thread-dry",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "guest@example.com"),
                  createHeader("Subject", "Check-in question"),
                  createHeader("Date", "Tue, 10 Feb 2026 16:00:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    // threads.list was called with a label-absence query
    const calledWith = gmail.users.threads.list.mock.calls[0][0] as { q: string };
    expect(calledWith.q).toContain("-label:");
    expect(calledWith.q).not.toContain("is:unread");

    // Result includes thread count
    expect(typeof payload.counts.scannedThreads).toBe("number");

    // messages.modify must NOT be called in dryRun mode
    expect(gmail.users.messages.modify).not.toHaveBeenCalled();

    // dryRun flag reflected in result
    expect(payload.dryRun).toBe(true);
  });
});

describe("gmail_organize_inbox classification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips promotional false positives from mailing domains and list headers", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const { gmail, messageStore } = createGmailStub({
      labels: [needsProcessing],
      threads: {
        "thread-6": {
          id: "thread-6",
          messages: [
            {
              id: "msg-6",
              threadId: "thread-6",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "ITALO IMPRESA <italoimpresa@mailing.italotreno.it>"),
                  createHeader("Subject", "Massima flessibilità e 40% di Cashback"),
                  createHeader("List-Id", "newsletter.italotreno.it"),
                  createHeader("Date", "Tue, 10 Feb 2026 15:00:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.labeledNeedsProcessing).toBe(0);
    expect(payload.counts.labeledPromotional).toBe(1);
    expect(messageStore["msg-6"].labelIds).toEqual(["INBOX", "UNREAD"]);
  });

  it("skips generic no-reply senders even if domain is not pre-listed", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing],
      threads: {
        "thread-7": {
          id: "thread-7",
          messages: [
            {
              id: "msg-7",
              threadId: "thread-7",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "Some Service <no-reply@service.example>"),
                  createHeader("Subject", "Important account update"),
                  createHeader("Date", "Tue, 10 Feb 2026 15:10:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.labeledNeedsProcessing).toBe(0);
    expect(payload.counts.labeledPromotional).toBe(1);
  });

  it("routes Octorate cancellations to cancellation handler (not promotional)", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const promotional = { id: "label-promo", name: "Brikette/Outcome/Promotional" };
    const cancellationReceived = { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" };
    const cancellationProcessed = { id: "label-cancel-processed", name: "Brikette/Workflow/Cancellation-Processed" };
    const cancellationParseFailed = { id: "label-cancel-parse-failed", name: "Brikette/Workflow/Cancellation-Parse-Failed" };
    const cancellationBookingNotFound = { id: "label-cancel-not-found", name: "Brikette/Workflow/Cancellation-Booking-Not-Found" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing, promotional, cancellationReceived, cancellationProcessed, cancellationParseFailed, cancellationBookingNotFound],
      threads: {
        "thread-9": {
          id: "thread-9",
          messages: [
            {
              id: "msg-9",
              threadId: "thread-9",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW CANCELLATION Booking 2026-05-01"),
                  createHeader("Date", "Tue, 10 Feb 2026 15:25:00 +0000"),
                ],
                body: {
                  data: encodeBase64Url("<html>NEW CANCELLATION 6896451364_5972003394 Booking 2026-05-01</html>"),
                },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // Mock processCancellationEmail to return success
    processCancellationEmailMock.mockResolvedValue({
      status: "success",
      reservationCode: "6896451364",
      activitiesWritten: 2,
    });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedCancellations).toBe(1);
    expect(payload.counts.labeledPromotional).toBe(0);
    expect(payload.counts.labeledNeedsProcessing).toBe(0);
    expect(payload.counts.labeledDeferred).toBe(0);
  });

  it("routes Octorate 'Reservation ... Cancelled' variant to cancellation handler", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const promotional = { id: "label-promo", name: "Brikette/Outcome/Promotional" };
    const cancellationReceived = { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" };
    const cancellationProcessed = { id: "label-cancel-processed", name: "Brikette/Workflow/Cancellation-Processed" };
    const cancellationParseFailed = { id: "label-cancel-parse-failed", name: "Brikette/Workflow/Cancellation-Parse-Failed" };
    const cancellationBookingNotFound = { id: "label-cancel-not-found", name: "Brikette/Workflow/Cancellation-Booking-Not-Found" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing, promotional, cancellationReceived, cancellationProcessed, cancellationParseFailed, cancellationBookingNotFound],
      threads: {
        "thread-9b": {
          id: "thread-9b",
          messages: [
            {
              id: "msg-9b",
              threadId: "thread-9b",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "Reservation VL2XH9 Cancelled"),
                  createHeader("Date", "Tue, 10 Feb 2026 15:30:00 +0000"),
                ],
                body: {
                  data: encodeBase64Url("<html>Reservation VL2XH9 Cancelled</html>"),
                },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });
    processCancellationEmailMock.mockResolvedValue({
      status: "success",
      reservationCode: "VL2XH9",
      activitiesWritten: 1,
    });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedCancellations).toBe(1);
    expect(payload.counts.labeledPromotional).toBe(0);
  });
});

describe("gmail_organize_inbox classification (octorate reservation variants)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processes Octorate NEW RESERVATION emails into guest drafts", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const processedDrafted = { id: "label-processed-drafted", name: "Brikette/Outcome/Drafted" };
    const { gmail, messageStore, draftStore } = createGmailStub({
      labels: [needsProcessing, processedDrafted],
      threads: {
        "thread-10": {
          id: "thread-10",
          messages: [
            {
              id: "msg-10",
              threadId: "thread-10",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "multipart/alternative",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW RESERVATION 6355834117_6080280211 Booking 2026-07-11"),
                  createHeader("Date", "Wed, 11 Feb 2026 07:15:07 +0100"),
                ],
                parts: [
                  {
                    mimeType: "text/plain",
                    body: {
                      data: encodeBase64Url(
                        "NEW RESERVATION 6355834117_6080280211 Booking 2026-07-11 - 2026-07-13"
                      ),
                    },
                    headers: [],
                  },
                  {
                    mimeType: "text/html",
                    body: {
                      data: encodeBase64Url(`
                        <table>
                          <tr><td><b>reservation code</b></td><td>6355834117_6080280211</td></tr>
                          <tr><td><b>guest name</b></td><td>John Example</td></tr>
                          <tr><td>email</td><td><a href="mailto:john.guest@example.com">john.guest@example.com</a></td></tr>
                          <tr><td><b>check in</b></td><td>2026-07-11</td></tr>
                          <tr><td><b>nights</b></td><td>2</td></tr>
                          <tr><td><b>total amount</b></td><td>274.19</td></tr>
                          <tr><td><b>Room 7</b></td><td>OTA, Non Refundable</td></tr>
                        </table>
                      `),
                    },
                    headers: [],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedBookingReservations).toBe(1);
    expect(payload.counts.routedBookingMonitor).toBe(0);
    expect(payload.counts.labeledPromotional).toBe(0);
    expect(payload.counts.labeledNeedsProcessing).toBe(0);
    expect(payload.counts.labeledDeferred).toBe(0);
    expect(gmail.users.drafts.create).toHaveBeenCalledTimes(1);
    expect(draftStore).toHaveLength(1);
    const rawDraft = decodeBase64Url(draftStore[0]?.raw ?? "");
    expect(rawDraft).toContain("Subject: Your Hostel Brikette Reservation");
    expect(rawDraft).toContain("Thank you for choosing to stay with us. Below is some essential information.");
    expect(rawDraft).toContain("HERE ARE YOUR RESERVATION DETAILS:");
    expect(rawDraft).toContain("Source: Booking.com");
    expect(rawDraft).toContain("Reservation Code: 6355834117");
    expect(rawDraft).toContain("Payment terms for room: Your booking is pre-paid and non-refundable.");
    expect(rawDraft).toContain("-- Details for Room #7 --");
    expect(rawDraft).not.toContain("Please reply with \"Agree\" within 48 hours.");
    expect(payload.samples.bookingReservations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageId: "msg-10",
          guestEmail: "john.guest@example.com",
        }),
      ])
    );
    expect(messageStore["msg-10"].labelIds).toContain(processedDrafted.id);
    expect(messageStore["msg-10"].labelIds).not.toContain("INBOX");
    expect(messageStore["msg-10"].labelIds).not.toContain("UNREAD");
  });

  it("routes Octorate confirmed/modification/change variants through booking handler (not promotional)", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing],
      threads: {
        "thread-10b": {
          id: "thread-10b",
          messages: [
            {
              id: "msg-10b",
              threadId: "thread-10b",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "Reservation VL2XH9 Confirmed"),
                  createHeader("Date", "Wed, 11 Feb 2026 07:16:00 +0100"),
                ],
                body: {
                  data: encodeBase64Url(`
                    <table>
                      <tr><td><b>reservation code</b></td><td>6355834117_6080280211</td></tr>
                      <tr><td><b>guest name</b></td><td>John Example</td></tr>
                      <tr><td>email</td><td><a href="mailto:john.guest@example.com">john.guest@example.com</a></td></tr>
                      <tr><td><b>check in</b></td><td>2026-07-11</td></tr>
                      <tr><td><b>nights</b></td><td>2</td></tr>
                      <tr><td><b>total amount</b></td><td>274.19</td></tr>
                    </table>
                  `),
                },
              },
            },
          ],
        },
        "thread-10c": {
          id: "thread-10c",
          messages: [
            {
              id: "msg-10c",
              threadId: "thread-10c",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW MODIFICATION 5505142157_6048923085 Booking 2026-08-06 - 2026-08-10"),
                  createHeader("Date", "Wed, 28 Jan 2026 12:03:18 +0100"),
                ],
                body: {
                  data: encodeBase64Url(`
                    <table>
                      <tr><td><b>reservation code</b></td><td>5505142157_6048923085</td></tr>
                      <tr><td><b>guest name</b></td><td>Carolina Solte</td></tr>
                      <tr><td>email</td><td><a href="mailto:csolte.153181@guest.booking.com">csolte.153181@guest.booking.com</a></td></tr>
                      <tr><td><b>check in</b></td><td>2026-08-06</td></tr>
                      <tr><td><b>nights</b></td><td>4</td></tr>
                    </table>
                  `),
                },
              },
            },
          ],
        },
        "thread-10d": {
          id: "thread-10d",
          messages: [
            {
              id: "msg-10d",
              threadId: "thread-10d",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "Reservation 5505142157_6048923085 has been changed"),
                  createHeader("Date", "Wed, 28 Jan 2026 12:05:18 +0100"),
                ],
                body: {
                  data: encodeBase64Url(`
                    <table>
                      <tr><td><b>reservation code</b></td><td>5505142157_6048923085</td></tr>
                      <tr><td><b>guest name</b></td><td>Carolina Solte</td></tr>
                      <tr><td>email</td><td><a href="mailto:csolte.153181@guest.booking.com">csolte.153181@guest.booking.com</a></td></tr>
                      <tr><td><b>check in</b></td><td>2026-08-06</td></tr>
                      <tr><td><b>nights</b></td><td>4</td></tr>
                    </table>
                  `),
                },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedBookingReservations).toBe(3);
    expect(payload.counts.labeledPromotional).toBe(0);
  });

  it("keeps non-operational Octorate system subjects as promotional", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const promotional = { id: "label-promo", name: "Brikette/Outcome/Promotional" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing, promotional],
      threads: {
        "thread-12a": {
          id: "thread-12a",
          messages: [
            {
              id: "msg-12a",
              threadId: "thread-12a",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "A customer saved their research"),
                ],
              },
            },
          ],
        },
        "thread-12b": {
          id: "thread-12b",
          messages: [
            {
              id: "msg-12b",
              threadId: "thread-12b",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "Allow login in Octorate"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.labeledPromotional).toBe(2);
    expect(payload.counts.processedBookingReservations).toBe(0);
    expect(payload.counts.processedCancellations).toBe(0);
  });
});

describe("gmail_organize_inbox classification (deferred handling)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defers NEW RESERVATION emails when guest email cannot be parsed", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const deferred = { id: "label-deferred", name: "Brikette/Queue/Deferred" };
    const { gmail, messageStore } = createGmailStub({
      labels: [needsProcessing, deferred],
      threads: {
        "thread-11": {
          id: "thread-11",
          messages: [
            {
              id: "msg-11",
              threadId: "thread-11",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/plain",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW RESERVATION 8888888888_1111111111 Booking 2026-08-01"),
                ],
                body: { data: encodeBase64Url("NEW RESERVATION without guest email") },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedBookingReservations).toBe(0);
    expect(payload.counts.labeledDeferred).toBe(1);
    expect(gmail.users.drafts.create).not.toHaveBeenCalled();
    expect(messageStore["msg-11"].labelIds).toContain(deferred.id);
    expect(messageStore["msg-11"].labelIds).not.toContain("INBOX");
    expect(payload.followUp.deferredNeedsInstruction).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageId: "msg-11",
          reason: "new-reservation-parse-failed",
        }),
      ])
    );
  });

  it("defers low-confidence emails and reports sender email for instruction", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
    const deferred = { id: "label-deferred", name: "Brikette/Queue/Deferred" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing, deferred],
      threads: {
        "thread-8": {
          id: "thread-8",
          messages: [
            {
              id: "msg-8",
              threadId: "thread-8",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "Unknown Sender <person@unknown-example.test>"),
                  createHeader("Subject", "Hello there"),
                  createHeader("Date", "Tue, 10 Feb 2026 15:20:00 +0000"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: true });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.labeledDeferred).toBe(1);
    expect(payload.followUp.deferredNeedsInstruction).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          senderEmail: "person@unknown-example.test",
          messageId: "msg-8",
        }),
      ])
    );
  });
});

describe("gmail_organize_inbox cancellation processing (TASK-15)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-01: Organize inbox with Octorate cancellation email → label applied, tool invoked
  it("TC-01: processes Octorate cancellation email and applies Cancellation-Received label", async () => {
    const cancellationReceived = { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" };
    const cancellationProcessed = { id: "label-cancel-processed", name: "Brikette/Workflow/Cancellation-Processed" };
    const cancellationParseFailed = { id: "label-cancel-parse-failed", name: "Brikette/Workflow/Cancellation-Parse-Failed" };
    const cancellationBookingNotFound = { id: "label-cancel-not-found", name: "Brikette/Workflow/Cancellation-Booking-Not-Found" };
    const { gmail, messageStore } = createGmailStub({
      labels: [cancellationReceived, cancellationProcessed, cancellationParseFailed, cancellationBookingNotFound],
      threads: {
        "thread-cancel-1": {
          id: "thread-cancel-1",
          messages: [
            {
              id: "msg-cancel-1",
              threadId: "thread-cancel-1",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30"),
                  createHeader("Date", "Fri, 14 Feb 2026 10:00:00 +0100"),
                ],
                body: {
                  data: encodeBase64Url("<html>NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30</html>"),
                },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // Mock processCancellationEmail to return success
    processCancellationEmailMock.mockResolvedValue({
      status: "success",
      reservationCode: "6896451364",
      activitiesWritten: 2,
    });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedCancellations).toBe(1);
    expect(messageStore["msg-cancel-1"].labelIds).toContain(cancellationReceived.id);
    expect(messageStore["msg-cancel-1"].labelIds).toContain(cancellationProcessed.id);
    expect(messageStore["msg-cancel-1"].labelIds).not.toContain("INBOX");
  });

  // TC-02: Organize inbox with Hostelworld cancellation email → NOT processed (OTA ignored)
  it("TC-02: ignores Hostelworld cancellation emails (OTA filtering)", async () => {
    const cancellationReceived = { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" };
    const promotional = { id: "label-promo", name: "Brikette/Outcome/Promotional" };
    const { gmail, messageStore } = createGmailStub({
      labels: [cancellationReceived, promotional],
      threads: {
        "thread-cancel-2": {
          id: "thread-cancel-2",
          messages: [
            {
              id: "msg-cancel-2",
              threadId: "thread-cancel-2",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "Hostelworld <noreply@hostelworld.com>"),
                  createHeader("Subject", "Cancellation notification for your booking"),
                  createHeader("Date", "Fri, 14 Feb 2026 10:05:00 +0100"),
                ],
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedCancellations).toBe(0);
    expect(messageStore["msg-cancel-2"].labelIds).not.toContain(cancellationReceived.id);
    expect(messageStore["msg-cancel-2"].labelIds).toContain(promotional.id);
  });

  // TC-03: Tool success response → Cancellation-Processed label applied
  it("TC-03: applies Cancellation-Processed label on tool success", async () => {
    const cancellationReceived = { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" };
    const cancellationProcessed = { id: "label-cancel-processed", name: "Brikette/Workflow/Cancellation-Processed" };
    const cancellationParseFailed = { id: "label-cancel-parse-failed", name: "Brikette/Workflow/Cancellation-Parse-Failed" };
    const cancellationBookingNotFound = { id: "label-cancel-not-found", name: "Brikette/Workflow/Cancellation-Booking-Not-Found" };
    const { gmail, messageStore } = createGmailStub({
      labels: [cancellationReceived, cancellationProcessed, cancellationParseFailed, cancellationBookingNotFound],
      threads: {
        "thread-cancel-3": {
          id: "thread-cancel-3",
          messages: [
            {
              id: "msg-cancel-3",
              threadId: "thread-cancel-3",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30"),
                  createHeader("Date", "Fri, 14 Feb 2026 10:10:00 +0100"),
                ],
                body: {
                  data: encodeBase64Url("<html>NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30</html>"),
                },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // Mock processCancellationEmail to return success
    processCancellationEmailMock.mockResolvedValue({
      status: "success",
      reservationCode: "6896451364",
      activitiesWritten: 2,
    });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedCancellations).toBe(1);
    expect(messageStore["msg-cancel-3"].labelIds).toContain(cancellationProcessed.id);
  });

  // TC-04: Tool parse-failed response → Cancellation-Parse-Failed label applied
  it("TC-04: applies Cancellation-Parse-Failed label on tool parse failure", async () => {
    const cancellationReceived = { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" };
    const cancellationProcessed = { id: "label-cancel-processed", name: "Brikette/Workflow/Cancellation-Processed" };
    const cancellationParseFailed = { id: "label-cancel-parse-failed", name: "Brikette/Workflow/Cancellation-Parse-Failed" };
    const cancellationBookingNotFound = { id: "label-cancel-not-found", name: "Brikette/Workflow/Cancellation-Booking-Not-Found" };
    const { gmail, messageStore } = createGmailStub({
      labels: [cancellationReceived, cancellationProcessed, cancellationParseFailed, cancellationBookingNotFound],
      threads: {
        "thread-cancel-4": {
          id: "thread-cancel-4",
          messages: [
            {
              id: "msg-cancel-4",
              threadId: "thread-cancel-4",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW CANCELLATION malformed email"),
                  createHeader("Date", "Fri, 14 Feb 2026 10:15:00 +0100"),
                ],
                body: {
                  data: encodeBase64Url("<html>Malformed cancellation email without reservation code</html>"),
                },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // Mock processCancellationEmail to return parse-failed
    processCancellationEmailMock.mockResolvedValue({
      status: "parse-failed",
      reason: "Could not extract reservation code from email",
    });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedCancellations).toBe(1);
    expect(messageStore["msg-cancel-4"].labelIds).toContain(cancellationParseFailed.id);
  });

  // TC-05: Tool booking-not-found response → Cancellation-Booking-Not-Found label applied
  it("TC-05: applies Cancellation-Booking-Not-Found label when booking doesn't exist", async () => {
    const cancellationReceived = { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" };
    const cancellationProcessed = { id: "label-cancel-processed", name: "Brikette/Workflow/Cancellation-Processed" };
    const cancellationParseFailed = { id: "label-cancel-parse-failed", name: "Brikette/Workflow/Cancellation-Parse-Failed" };
    const cancellationBookingNotFound = { id: "label-cancel-not-found", name: "Brikette/Workflow/Cancellation-Booking-Not-Found" };
    const { gmail, messageStore } = createGmailStub({
      labels: [cancellationReceived, cancellationProcessed, cancellationParseFailed, cancellationBookingNotFound],
      threads: {
        "thread-cancel-5": {
          id: "thread-cancel-5",
          messages: [
            {
              id: "msg-cancel-5",
              threadId: "thread-cancel-5",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                mimeType: "text/html",
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW CANCELLATION 9999999999_8888888888 Booking 2026-09-01"),
                  createHeader("Date", "Fri, 14 Feb 2026 10:20:00 +0100"),
                ],
                body: {
                  data: encodeBase64Url("<html>NEW CANCELLATION 9999999999_8888888888 Booking 2026-09-01</html>"),
                },
              },
            },
          ],
        },
      },
    });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // Mock processCancellationEmail to return booking-not-found
    processCancellationEmailMock.mockResolvedValue({
      status: "booking-not-found",
      reason: "Booking 9999999999 not found in Firebase",
    });

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect(payload.counts.processedCancellations).toBe(1);
    expect(messageStore["msg-cancel-5"].labelIds).toContain(cancellationBookingNotFound.id);
  });
});

// =============================================================================
// TC-03-05 & TC-03-06: Durable lock store integration tests (TASK-03)
// =============================================================================

describe("gmail_organize_inbox startup recovery (TC-03-05)", () => {
  let tmpDir: string;
  let auditLogPath: string;

  const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };
  const processing = { id: "label-processing", name: "Brikette/Queue/In-Progress" };

  beforeEach(() => {
    jest.clearAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "organize-inbox-recovery-"));
    auditLogPath = path.join(tmpDir, "email-audit-log.jsonl");
    process.env.AUDIT_LOG_PATH = auditLogPath;
  });

  afterEach(() => {
    // Restore a clean store so subsequent tests are not polluted
    setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
    delete process.env.AUDIT_LOG_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // TC-03-05: startup recovery requeues In-Progress emails with no valid lock file
  it("TC-03-05: startup recovery requeues an In-Progress email when no lock file exists", async () => {
    // Mock lock store: message has In-Progress label, but lock store has no entry for it
    const mockStore: LockStore = {
      acquire: jest.fn(() => true),
      release: jest.fn(),
      get: jest.fn((_messageId: string) => null), // no lock file
      isStale: jest.fn((_messageId: string, _timeoutMs: number) => false),
      list: jest.fn(() => [] as string[]),
    };
    setLockStore(mockStore);

    // The In-Progress message that will be "orphaned"
    const orphanedMsg: GmailMessage = {
      id: "msg-orphaned",
      threadId: "thread-orphaned",
      labelIds: [processing.id],
      payload: { headers: [] },
    };

    // messages.list returns the orphaned message (for In-Progress label query)
    // threads.list returns empty (no inbox threads to process)
    const labelsStore = [needsProcessing, processing];
    let labelCounter = labelsStore.length + 1;
    const messageStore: Record<string, GmailMessage> = {
      "msg-orphaned": { ...orphanedMsg },
    };

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
        threads: {
          list: jest.fn(async () => ({ data: { threads: [] } })),
          get: jest.fn(async ({ id }: { id: string }) => ({ data: {} })),
        },
        messages: {
          list: jest.fn(async () => ({
            data: { messages: [{ id: "msg-orphaned" }] },
          })),
          get: jest.fn(async ({ id }: { id: string }) => ({ data: messageStore[id] })),
          modify: jest.fn(async ({ id, requestBody }: { id: string; requestBody: { addLabelIds?: string[]; removeLabelIds?: string[] } }) => {
            const message = messageStore[id];
            if (!message) throw new Error(`Message not found: ${id}`);
            const remove = requestBody.removeLabelIds || [];
            const add = requestBody.addLabelIds || [];
            message.labelIds = message.labelIds.filter(l => !remove.includes(l));
            for (const labelId of add) {
              if (!message.labelIds.includes(labelId)) message.labelIds.push(labelId);
            }
            return { data: message };
          }),
          drafts: {
            create: jest.fn(),
          },
        },
        drafts: {
          create: jest.fn(),
        },
      },
    };
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", {
      dryRun: false,
    });

    // Should succeed
    expect((result as { isError?: boolean }).isError).not.toBe(true);

    // The orphaned message should have had In-Progress removed and Needs-Processing added
    expect(gmail.users.messages.modify).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-orphaned",
        requestBody: expect.objectContaining({
          removeLabelIds: expect.arrayContaining([processing.id]),
        }),
      })
    );

    // Lock store release should have been called for the orphaned message
    expect(mockStore.release).toHaveBeenCalledWith("msg-orphaned");
  });
});

describe("gmail_reconcile_in_progress staleHours default (TC-03-06)", () => {
  let tmpDir: string;

  const processing = { id: "label-processing", name: "Brikette/Queue/In-Progress" };
  const needsProcessing = { id: "label-needs", name: "Brikette/Queue/Needs-Processing" };

  beforeEach(() => {
    jest.clearAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "reconcile-stalehours-"));
    process.env.AUDIT_LOG_PATH = path.join(tmpDir, "email-audit-log.jsonl");

    // Use a clean file-backed store per test
    setLockStore(createLockStore(tmpDir));
  });

  afterEach(() => {
    setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
    delete process.env.AUDIT_LOG_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // TC-03-06: staleHours default in handleReconcileInProgress is 2 (not 24)
  it("TC-03-06: default staleHours for reconcile_in_progress is 2 hours — emails older than 2h are requeued, emails younger than 2h are kept", async () => {
    // A message that is 3 hours old (should be requeued by default 2h threshold)
    const threeHoursAgoMs = Date.now() - 3 * 60 * 60 * 1000;
    const threeHoursAgoSec = threeHoursAgoMs;

    const labelsStore = [needsProcessing, processing];
    let labelCounter = labelsStore.length + 1;
    const messageStore: Record<string, GmailMessage> = {
      "msg-stale-3h": {
        id: "msg-stale-3h",
        threadId: "thread-stale-3h",
        labelIds: [processing.id],
        payload: {
          headers: [
            { name: "From", value: "guest@example.com" },
            { name: "Subject", value: "Check-in question" },
            { name: "Date", value: new Date(threeHoursAgoSec).toUTCString() },
          ],
        },
        snippet: "Hi, question about check-in",
      },
    };

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
          list: jest.fn(async () => ({
            data: { messages: [{ id: "msg-stale-3h" }] },
          })),
          get: jest.fn(async ({ id }: { id: string }) => ({ data: messageStore[id] })),
          modify: jest.fn(async ({ id, requestBody }: { id: string; requestBody: { addLabelIds?: string[]; removeLabelIds?: string[] } }) => {
            const message = messageStore[id];
            if (!message) throw new Error(`Message not found: ${id}`);
            const remove = requestBody.removeLabelIds || [];
            const add = requestBody.addLabelIds || [];
            message.labelIds = message.labelIds.filter(l => !remove.includes(l));
            for (const labelId of add) {
              if (!message.labelIds.includes(labelId)) message.labelIds.push(labelId);
            }
            return { data: message };
          }),
        },
        threads: {
          list: jest.fn(async () => ({ data: { threads: [] } })),
          get: jest.fn(async () => ({ data: { messages: [] } })),
        },
        drafts: {
          create: jest.fn(),
        },
      },
    };
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // Call without staleHours arg — should use default of 2
    const result = await handleGmailTool("gmail_reconcile_in_progress", {
      dryRun: false,
    });

    expect((result as { isError?: boolean }).isError).not.toBe(true);
    const payload = JSON.parse(result.content[0].text) as {
      staleHours: number;
      counts: { keptFresh: number; routedRequeued: number };
    };

    // Default staleHours should be 2
    expect(payload.staleHours).toBe(2);

    // 3h old message should be routed (not kept fresh), since 3h > 2h default
    expect(payload.counts.keptFresh).toBe(0);
  });
});

describe("TC-03: cancellation confirmation email drafting (WEAK-A2)", () => {
  const cancellationLabels = [
    { id: "label-cancel-received", name: "Brikette/Workflow/Cancellation-Received" },
    { id: "label-cancel-processed", name: "Brikette/Workflow/Cancellation-Processed" },
    { id: "label-cancel-parse-failed", name: "Brikette/Workflow/Cancellation-Parse-Failed" },
    { id: "label-cancel-not-found", name: "Brikette/Workflow/Cancellation-Booking-Not-Found" },
    { id: "label-needs", name: "Brikette/Queue/Needs-Processing" },
  ];

  function makeCancellationThread(id: string): Record<string, GmailThread> {
    return {
      [id]: {
        id,
        messages: [
          {
            id: `msg-${id}`,
            threadId: id,
            labelIds: ["INBOX", "UNREAD"],
            payload: {
              mimeType: "text/html",
              headers: [
                createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                createHeader("Subject", "NEW CANCELLATION RES-42_999 Booking 2026-09-01"),
                createHeader("Date", "Mon, 01 Sep 2026 09:00:00 +0000"),
              ],
              body: { data: encodeBase64Url("<html>NEW CANCELLATION RES-42 Booking 2026-09-01</html>") },
            },
          },
        ],
      },
    };
  }

  beforeEach(() => {
    sendGuestEmailActivityMock.mockReset();
  });

  it("TC-03a: drafts code 27 email for each occupant returned in guestEmails", async () => {
    const { gmail } = createGmailStub({ labels: cancellationLabels, threads: makeCancellationThread("t-03a") });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    // processCancellationEmail returns pre-resolved guest emails
    processCancellationEmailMock.mockResolvedValue({
      status: "success",
      reservationCode: "RES-42",
      activitiesWritten: 2,
      occupantIds: ["occ1", "occ2"],
      guestEmails: { occ1: "guest@example.com" }, // occ2 has no email
    });

    sendGuestEmailActivityMock.mockResolvedValue({ status: "drafted" });

    await handleGmailTool("gmail_organize_inbox", { dryRun: false });

    expect(sendGuestEmailActivityMock).toHaveBeenCalledTimes(1);
    expect(sendGuestEmailActivityMock).toHaveBeenCalledWith(
      expect.objectContaining({ bookingRef: "RES-42", activityCode: 27, recipients: ["guest@example.com"] })
    );
  });

  it("TC-03b: skips email draft when guestEmails map is empty", async () => {
    const { gmail } = createGmailStub({ labels: cancellationLabels, threads: makeCancellationThread("t-03b") });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    processCancellationEmailMock.mockResolvedValue({
      status: "success",
      reservationCode: "RES-42",
      activitiesWritten: 1,
      occupantIds: ["occ1"],
      guestEmails: {}, // no occupants have email
    });

    await handleGmailTool("gmail_organize_inbox", { dryRun: false });

    expect(sendGuestEmailActivityMock).not.toHaveBeenCalled();
  });

  it("TC-03c: cancellation still succeeds when email drafting throws", async () => {
    const { gmail } = createGmailStub({ labels: cancellationLabels, threads: makeCancellationThread("t-03c") });
    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    processCancellationEmailMock.mockResolvedValue({
      status: "success",
      reservationCode: "RES-42",
      activitiesWritten: 1,
      occupantIds: ["occ1"],
      guestEmails: { occ1: "guest@example.com" },
    });

    sendGuestEmailActivityMock.mockRejectedValue(new Error("Gmail API unavailable"));

    const result = await handleGmailTool("gmail_organize_inbox", { dryRun: false });
    const payload = JSON.parse(result.content[0].text);

    expect((result as { isError?: boolean }).isError).not.toBe(true);
    expect(payload.counts.processedCancellations).toBe(1);
  });
});
