/** @jest-environment node */

import { getGmailClient } from "../clients/gmail";
import { handleGmailTool } from "../tools/gmail";

type GmailLabel = { id: string; name: string };
type GmailHeader = { name: string; value: string };
type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  payload: { headers: GmailHeader[] };
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

function createGmailStub({
  labels,
  threads,
}: {
  labels: GmailLabel[];
  threads: Record<string, GmailThread>;
}): { gmail: GmailStub; labelsStore: GmailLabel[]; messageStore: Record<string, GmailMessage> } {
  const labelsStore = [...labels];
  const threadStore = { ...threads };
  const messageStore: Record<string, GmailMessage> = {};
  for (const thread of Object.values(threadStore)) {
    for (const message of thread.messages) {
      messageStore[message.id] = message;
    }
  }

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
      },
    },
  };

  return { gmail, labelsStore, messageStore };
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
