/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { checkBookingRefDuplicate,handleGmailTool, setLockStore  } from "../tools/gmail";
import { processCancellationEmail } from "../tools/process-cancellation-email";
import { createLockStore } from "../utils/lock-store";

import {
  createHeader,
  encodeBase64Url,
  type GmailHeader,
  type GmailMessage,
  type GmailPayload,
  type GmailThread,
  makeGmailMessage,
  makeGmailThread,
} from "./fixtures/email/sample-threads";

type GmailLabel = { id: string; name: string };

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
      list: jest.Mock;
    };
  };
};

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

jest.mock("../tools/process-cancellation-email", () => ({
  processCancellationEmail: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

// Temp dir for audit log isolation
let _globalTmpDir: string;
let auditLogPath: string;
beforeAll(() => {
  _globalTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "booking-dedup-"));
  auditLogPath = path.join(_globalTmpDir, "email-audit-log.jsonl");
  process.env.AUDIT_LOG_PATH = auditLogPath;
  setLockStore(createLockStore(path.join(_globalTmpDir, "locks")));
});
afterAll(() => {
  setLockStore(createLockStore(fs.mkdtempSync(path.join(os.tmpdir(), "lock-store-restore-"))));
  delete process.env.AUDIT_LOG_PATH;
  fs.rmSync(_globalTmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOctorateReservationHtml(reservationCode: string, guestEmail: string): string {
  return `
    <table>
      <tr><td><b>reservation code</b></td><td>${reservationCode}</td></tr>
      <tr><td><b>guest name</b></td><td>John Test</td></tr>
      <tr><td>email</td><td><a href="mailto:${guestEmail}">${guestEmail}</a></td></tr>
      <tr><td><b>check in</b></td><td>2026-07-11</td></tr>
      <tr><td><b>nights</b></td><td>2</td></tr>
      <tr><td><b>total amount</b></td><td>274.19</td></tr>
      <tr><td><b>Room 7</b></td><td>OTA, Non Refundable</td></tr>
    </table>
  `;
}

function makeReservationThread(
  threadId: string,
  messageId: string,
  reservationCode: string,
  guestEmail: string = "guest@example.com",
): GmailThread {
  return makeGmailThread({
    id: threadId,
    messages: [
      makeGmailMessage({
        id: messageId,
        threadId,
        payload: {
          mimeType: "multipart/alternative",
          headers: [
            createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
            createHeader(
              "Subject",
              `NEW RESERVATION ${reservationCode}_6080280211 Booking 2026-07-11`,
            ),
            createHeader("Date", "Wed, 11 Feb 2026 07:15:07 +0100"),
          ],
          parts: [
            {
              mimeType: "text/plain",
              body: {
                data: encodeBase64Url(
                  `NEW RESERVATION ${reservationCode}_6080280211 Booking 2026-07-11 - 2026-07-13`,
                ),
              },
              headers: [],
            },
            {
              mimeType: "text/html",
              body: {
                data: encodeBase64Url(
                  makeOctorateReservationHtml(`${reservationCode}_6080280211`, guestEmail),
                ),
              },
              headers: [],
            },
          ],
        },
      }),
    ],
  });
}

function createGmailStubWithDrafts({
  labels,
  threads,
  existingDrafts = [],
}: {
  labels: GmailLabel[];
  threads: Record<string, GmailThread>;
  existingDrafts?: Array<{ id: string; message?: { id: string; snippet?: string; payload?: { headers?: GmailHeader[] } } }>;
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
          data: { threads: Object.values(threadStore).map((thread) => ({ id: thread.id })) },
        })),
        get: jest.fn(async ({ id }: { id: string }) => ({ data: threadStore[id] })),
      },
      messages: {
        list: jest.fn(async () => ({ data: { messages: [] } })),
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
            const remove = requestBody.removeLabelIds || [];
            const add = requestBody.addLabelIds || [];
            message.labelIds = message.labelIds.filter((labelId) => !remove.includes(labelId));
            for (const labelId of add) {
              if (!message.labelIds.includes(labelId)) {
                message.labelIds.push(labelId);
              }
            }
            return { data: message };
          },
        ),
        get: jest.fn(async ({ id }: { id: string }) => ({ data: messageStore[id] })),
      },
      drafts: {
        create: jest.fn(
          async ({ requestBody }: { requestBody: { message?: { raw?: string } } }) => {
            const draftId = `draft-${draftCounter++}`;
            draftStore.push({ id: draftId, raw: requestBody.message?.raw });
            return {
              data: {
                id: draftId,
                message: { id: `draft-message-${draftId}` },
              },
            };
          },
        ),
        list: jest.fn(async () => ({
          data: { drafts: existingDrafts },
        })),
      },
    },
  };

  return { gmail, labelsStore, messageStore, draftStore };
}

// ---------------------------------------------------------------------------
// Unit tests: checkBookingRefDuplicate
// ---------------------------------------------------------------------------

describe("checkBookingRefDuplicate", () => {
  it("returns isDuplicate=false when no drafts match the booking ref", async () => {
    const mockGmail = {
      users: {
        drafts: {
          list: jest.fn(async () => ({ data: { drafts: [] } })),
        },
      },
    };

    const result = await checkBookingRefDuplicate(
      mockGmail as unknown as Parameters<typeof checkBookingRefDuplicate>[0],
      "6355834117",
    );

    expect(result.isDuplicate).toBe(false);
    expect(mockGmail.users.drafts.list).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "me",
        q: expect.stringContaining("6355834117"),
      }),
    );
  });

  it("returns isDuplicate=true when a draft with matching booking ref exists", async () => {
    const mockGmail = {
      users: {
        drafts: {
          list: jest.fn(async () => ({
            data: {
              drafts: [{ id: "existing-draft-1", message: { id: "msg-d1" } }],
            },
          })),
        },
      },
    };

    const result = await checkBookingRefDuplicate(
      mockGmail as unknown as Parameters<typeof checkBookingRefDuplicate>[0],
      "6355834117",
    );

    expect(result.isDuplicate).toBe(true);
  });

  it("returns isDuplicate=false (fail-open) when the API call throws", async () => {
    const mockGmail = {
      users: {
        drafts: {
          list: jest.fn(async () => {
            throw new Error("API rate limit");
          }),
        },
      },
    };

    const result = await checkBookingRefDuplicate(
      mockGmail as unknown as Parameters<typeof checkBookingRefDuplicate>[0],
      "6355834117",
    );

    expect(result.isDuplicate).toBe(false);
  });

  it("returns isDuplicate=false (fail-open) when reservationCode is empty", async () => {
    const mockGmail = {
      users: {
        drafts: {
          list: jest.fn(async () => ({ data: { drafts: [] } })),
        },
      },
    };

    const result = await checkBookingRefDuplicate(
      mockGmail as unknown as Parameters<typeof checkBookingRefDuplicate>[0],
      "",
    );

    expect(result.isDuplicate).toBe(false);
    // Should not even call drafts.list for empty ref
    expect(mockGmail.users.drafts.list).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Integration tests: processBookingReservationNotification via handleGmailTool
// ---------------------------------------------------------------------------

describe("gmail_organize_inbox booking-ref dedup", () => {
  const LABELS: GmailLabel[] = [
    { id: "label-needs", name: "Brikette/Queue/Needs-Processing" },
    { id: "label-drafted", name: "Brikette/Outcome/Drafted" },
    { id: "label-deferred", name: "Brikette/Outcome/Deferred" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset audit log for each test
    if (fs.existsSync(auditLogPath)) {
      fs.writeFileSync(auditLogPath, "");
    }
  });

  // TC-01: First booking notification → draft created normally
  it("TC-01: creates draft for first booking notification", async () => {
    const reservationCode = "1111111111";
    const thread = makeReservationThread("thread-res-1", "msg-res-1", reservationCode);

    const { gmail, draftStore } = createGmailStubWithDrafts({
      labels: LABELS,
      threads: { "thread-res-1": thread },
      existingDrafts: [], // No existing drafts
    });

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", {
      specificStartDate: "2026-02-10",
    });
    const payload = JSON.parse(result.content[0].text);

    // Draft should have been created
    expect(draftStore.length).toBe(1);
    expect(payload.counts.processedBookingReservations).toBe(1);
  });

  // TC-02: Second notification for same booking ref → draft skipped, audit logged
  it("TC-02: skips draft when same booking ref already has a draft", async () => {
    const reservationCode = "2222222222";
    const thread = makeReservationThread("thread-res-2", "msg-res-2", reservationCode);

    const { gmail, draftStore } = createGmailStubWithDrafts({
      labels: LABELS,
      threads: { "thread-res-2": thread },
      existingDrafts: [
        // Simulate an existing draft containing this reservation code
        { id: "existing-draft-99", message: { id: "msg-existing" } },
      ],
    });

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", {
      specificStartDate: "2026-02-10",
    });
    const payload = JSON.parse(result.content[0].text);

    // Draft should NOT have been created (dedup skipped it)
    expect(draftStore.length).toBe(0);
    expect(gmail.users.drafts.create).not.toHaveBeenCalled();

    // Should still be counted as processed (dedup is a valid processing outcome)
    expect(payload.counts.processedBookingReservations).toBe(1);

    // Audit log should contain a dedup entry
    const auditLines = fs.readFileSync(auditLogPath, "utf-8").trim().split("\n").filter(Boolean);
    const dedupEntry = auditLines
      .map((line) => JSON.parse(line))
      .find((e: { action: string }) => e.action === "booking-dedup-skipped");
    expect(dedupEntry).toBeDefined();
    expect(dedupEntry.messageId).toBe("msg-res-2");
  });

  // TC-03: Booking ref extraction fails → proceed normally (fail-open)
  it("TC-03: creates draft when booking ref extraction fails (fail-open)", async () => {
    // Create a reservation thread with a valid email in HTML but no reservation code
    // that is still parseable (has guest email at minimum)
    const threadId = "thread-res-3";
    const messageId = "msg-res-3";
    const htmlBody = `
      <table>
        <tr><td><b>reservation code</b></td><td></td></tr>
        <tr><td><b>guest name</b></td><td>Jane Fail</td></tr>
        <tr><td>email</td><td><a href="mailto:jane@example.com">jane@example.com</a></td></tr>
        <tr><td><b>check in</b></td><td>2026-07-15</td></tr>
        <tr><td><b>nights</b></td><td>3</td></tr>
        <tr><td><b>total amount</b></td><td>150.00</td></tr>
      </table>
    `;

    const thread = makeGmailThread({
      id: threadId,
      messages: [
        makeGmailMessage({
          id: messageId,
          threadId,
          payload: {
            mimeType: "multipart/alternative",
            headers: [
              createHeader("From", "Octorate <noreply@smtp.octorate.com>"),
              createHeader("Subject", "NEW RESERVATION Booking 2026-07-15"),
              createHeader("Date", "Wed, 11 Feb 2026 07:15:07 +0100"),
            ],
            parts: [
              {
                mimeType: "text/plain",
                body: {
                  data: encodeBase64Url("NEW RESERVATION Booking 2026-07-15 - 2026-07-18"),
                },
                headers: [],
              },
              {
                mimeType: "text/html",
                body: { data: encodeBase64Url(htmlBody) },
                headers: [],
              },
            ],
          },
        }),
      ],
    });

    const { gmail, draftStore } = createGmailStubWithDrafts({
      labels: LABELS,
      threads: { [threadId]: thread },
      existingDrafts: [], // No existing drafts
    });

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", {
      specificStartDate: "2026-02-10",
    });
    const payload = JSON.parse(result.content[0].text);

    // Draft should be created despite empty reservation code (fail-open)
    expect(draftStore.length).toBe(1);
    expect(payload.counts.processedBookingReservations).toBe(1);
  });

  // TC-04: Similar but different booking refs → both drafts created
  it("TC-04: creates drafts for different booking refs", async () => {
    const code1 = "3333333333";
    const code2 = "4444444444";
    const thread1 = makeReservationThread("thread-res-4a", "msg-res-4a", code1, "guest1@example.com");
    const thread2 = makeReservationThread("thread-res-4b", "msg-res-4b", code2, "guest2@example.com");

    // drafts.list returns empty for both queries (different codes)
    const draftsListMock = jest.fn(async () => ({
      data: { drafts: [] },
    }));

    const { gmail, draftStore } = createGmailStubWithDrafts({
      labels: LABELS,
      threads: {
        "thread-res-4a": thread1,
        "thread-res-4b": thread2,
      },
      existingDrafts: [],
    });

    // Override drafts.list to return empty for all queries
    gmail.users.drafts.list = draftsListMock;

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleGmailTool("gmail_organize_inbox", {
      specificStartDate: "2026-02-10",
    });
    const payload = JSON.parse(result.content[0].text);

    // Both drafts should be created
    expect(draftStore.length).toBe(2);
    expect(payload.counts.processedBookingReservations).toBe(2);

    // drafts.list should have been called with different queries
    const listCalls = draftsListMock.mock.calls;
    expect(listCalls.length).toBe(2);
    const queries = listCalls.map((call) => call[0].q);
    expect(queries.some((q: string) => q.includes(code1))).toBe(true);
    expect(queries.some((q: string) => q.includes(code2))).toBe(true);
  });
});
