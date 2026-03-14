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

  it("sends booking email immediately and emits email_sent telemetry", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-1", message: { id: "msg-1" } } });
    const sendDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "msg-sent-1" } });
    const gmail = {
      users: {
        drafts: {
          create: createDraftMock,
          send: sendDraftMock,
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
    expect(sendDraftMock).toHaveBeenCalledWith({
      userId: "me",
      requestBody: { id: "draft-1" },
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
    expect(payload.messageId).toBe("msg-sent-1");

    const rawLog = fs.readFileSync(auditLogPath, "utf-8");
    const telemetryLines = rawLog
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as { event_key?: string; source_path?: string; tool_name?: string });
    const sentEvent = telemetryLines.find((line) => line.event_key === "email_sent");
    expect(sentEvent).toMatchObject({
      event_key: "email_sent",
      source_path: "reception",
      tool_name: "mcp_send_booking_email",
    });
    expect(telemetryLines.find((line) => line.event_key === "email_draft_created")).toBeUndefined();
  });

  it("TC-09-03: returns success and calls send even when draft.send returns minimal data", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-2", message: { id: "msg-2" } } });
    const sendDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "msg-sent-2" } });
    const gmail = {
      users: {
        drafts: {
          create: createDraftMock,
          send: sendDraftMock,
        },
      },
    };

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await handleBookingEmailTool("mcp_send_booking_email", {
      bookingRef: "BOOK124",
      recipients: ["guest@example.com"],
      occupantLinks: ["https://example.com/occ1"],
    });

    expect(result).not.toMatchObject({ isError: true });
    expect(sendDraftMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(result.content[0].text) as { success: boolean };
    expect(payload.success).toBe(true);
  });

  it("returns validation error when occupant links are not URL formatted", async () => {
    const result = await handleBookingEmailTool("mcp_send_booking_email", {
      bookingRef: "BOOK125",
      recipients: ["guest@example.com"],
      occupantLinks: ["not-a-url"],
    });

    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toMatch(/occupantLinks\.0/i);
    expect(result.content[0].text).toMatch(/invalid url/i);
  });
});
