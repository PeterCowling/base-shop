/** @jest-environment node */

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool } from "../tools/gmail";

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

const getGmailClientMock = getGmailClient as jest.Mock;

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
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const spam = { id: "label-spam", name: "Brikette/Spam" };
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
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
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
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const processed = { id: "label-processed", name: "Brikette/Processed/Drafted" };
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
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const spam = { id: "label-spam", name: "Brikette/Spam" };
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

  it("scans all unread inbox emails by default (no date window)", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
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

    expect(gmail.users.threads.list).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "is:unread in:inbox",
      })
    );
    expect(payload.scanWindow.mode).toBe("all-unread");
  });
});

describe("gmail_organize_inbox classification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips promotional false positives from mailing domains and list headers", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
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
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
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

  it("routes strong non-customer senders to promotional even with booking keywords", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const promotional = { id: "label-promo", name: "Brikette/Promotional" };
    const { gmail } = createGmailStub({
      labels: [needsProcessing, promotional],
      threads: {
        "thread-9": {
          id: "thread-9",
          messages: [
            {
              id: "msg-9",
              threadId: "thread-9",
              labelIds: ["INBOX", "UNREAD"],
              payload: {
                headers: [
                  createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
                  createHeader("Subject", "NEW CANCELLATION Booking 2026-05-01"),
                  createHeader("Date", "Tue, 10 Feb 2026 15:25:00 +0000"),
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
    expect(payload.counts.labeledDeferred).toBe(0);
  });

  it("processes Octorate NEW RESERVATION emails into guest drafts", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const processedDrafted = { id: "label-processed-drafted", name: "Brikette/Processed/Drafted" };
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

  it("defers NEW RESERVATION emails when guest email cannot be parsed", async () => {
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const deferred = { id: "label-deferred", name: "Brikette/Inbox/Deferred" };
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
    const needsProcessing = { id: "label-needs", name: "Brikette/Inbox/Needs-Processing" };
    const deferred = { id: "label-deferred", name: "Brikette/Inbox/Deferred" };
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
