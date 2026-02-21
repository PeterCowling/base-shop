/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import { handleBookingEmailTool } from "../tools/booking-email";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

function decodeRawEmail(raw: string): string {
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = Buffer.from(padded, "base64");
  return buffer.toString("utf-8");
}

describe("booking email tool", () => {
  let tmpDir: string;
  let auditLogPath: string;

  beforeEach(() => {
    jest.resetAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "booking-email-test-"));
    auditLogPath = path.join(tmpDir, "email-audit-log.jsonl");
    process.env.AUDIT_LOG_PATH = auditLogPath;
  });

  afterEach(() => {
    delete process.env.AUDIT_LOG_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates booking email draft with occupant links", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-1", message: { id: "msg-1" } } });
    const modifyMessageMock = jest.fn().mockResolvedValue({});
    const listLabelsMock = jest.fn().mockResolvedValue({
      data: {
        labels: [
          { id: "lbl-ready", name: "Brikette/Drafts/Ready-For-Review" },
          { id: "lbl-drafted", name: "Brikette/Outcome/Drafted" },
          { id: "lbl-human", name: "Brikette/Agent/Human" },
          { id: "lbl-pre-arrival", name: "Brikette/Outbound/Pre-Arrival" },
        ],
      },
    });
    const gmail = {
      users: {
        drafts: {
          create: createDraftMock,
        },
        messages: {
          modify: modifyMessageMock,
        },
        labels: {
          list: listLabelsMock,
          create: jest.fn(),
        },
      },
    };

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleBookingEmailTool("mcp_send_booking_email", {
      bookingRef: "BOOK123",
      recipients: ["guest@example.com"],
      occupantLinks: ["https://example.com/occ1", "https://example.com/occ2"],
    });

    expect(result).toHaveProperty("content");
    expect(createDraftMock).toHaveBeenCalledWith({
      userId: "me",
      requestBody: {
        message: { raw: expect.any(String) },
      },
    });
    expect(modifyMessageMock).toHaveBeenCalledWith({
      userId: "me",
      id: "msg-1",
      requestBody: {
        addLabelIds: expect.arrayContaining([
          "lbl-ready",
          "lbl-drafted",
          "lbl-human",
          "lbl-pre-arrival",
        ]),
      },
    });

    const raw = createDraftMock.mock.calls[0][0].requestBody.message.raw as string;
    const decoded = decodeRawEmail(raw);

    expect(decoded).toContain("To: guest@example.com");
    expect(decoded).toContain("Subject: Your booking details (BOOK123)");
    expect(decoded).toContain("Guest 1: https://example.com/occ1");
    expect(decoded).toContain("Guest 2: https://example.com/occ2");

    const payload = JSON.parse(result.content[0].text) as {
      success: boolean;
      draftId?: string;
      messageId?: string;
    };
    expect(payload.success).toBe(true);
    expect(payload.draftId).toBe("draft-1");
    expect(payload.messageId).toBe("msg-1");

    const rawLog = fs.readFileSync(auditLogPath, "utf-8");
    const telemetryLines = rawLog
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as { event_key?: string; source_path?: string; tool_name?: string });
    const draftCreatedEvent = telemetryLines.find((line) => line.event_key === "email_draft_created");
    const outcomeLabeledEvent = telemetryLines.find((line) => line.event_key === "email_outcome_labeled");
    expect(draftCreatedEvent).toMatchObject({
      event_key: "email_draft_created",
      source_path: "reception",
      tool_name: "mcp_send_booking_email",
    });
    expect(outcomeLabeledEvent).toMatchObject({
      event_key: "email_outcome_labeled",
      source_path: "reception",
      tool_name: "mcp_send_booking_email",
      action: "drafted",
    });
  });

  it("TC-09-03: returns actionable error when drafted outcome labels cannot be applied", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-2", message: { id: "msg-2" } } });
    const modifyMessageMock = jest
      .fn()
      .mockRejectedValue(new Error("label mutation failed"));
    const gmail = {
      users: {
        drafts: {
          create: createDraftMock,
        },
        messages: {
          modify: modifyMessageMock,
        },
        labels: {
          list: jest.fn().mockResolvedValue({
            data: {
              labels: [
                { id: "lbl-ready", name: "Brikette/Drafts/Ready-For-Review" },
                { id: "lbl-drafted", name: "Brikette/Outcome/Drafted" },
                { id: "lbl-human", name: "Brikette/Agent/Human" },
                { id: "lbl-pre-arrival", name: "Brikette/Outbound/Pre-Arrival" },
              ],
            },
          }),
          create: jest.fn(),
        },
      },
    };

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleBookingEmailTool("mcp_send_booking_email", {
      bookingRef: "BOOK124",
      recipients: ["guest@example.com"],
      occupantLinks: ["https://example.com/occ1"],
    });

    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("Failed to apply draft outcome labels");
    expect(createDraftMock).toHaveBeenCalledTimes(1);
  });
});
