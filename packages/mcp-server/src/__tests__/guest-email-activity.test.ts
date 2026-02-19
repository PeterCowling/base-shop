/** @jest-environment node */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { getGmailClient } from "../clients/gmail";
import {
  clearGuestEmailTemplateCache,
  sendGuestEmailActivity,
} from "../tools/guest-email-activity";

jest.mock("../clients/gmail", () => ({
  getGmailClient: jest.fn(),
}));

const getGmailClientMock = getGmailClient as jest.Mock;

function decodeRawEmail(raw: string): string {
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = Buffer.from(padded, "base64");
  return buffer.toString("utf-8");
}

function buildGuestActivityGmailMock(
  createDraftMock: jest.Mock,
  modifyMessageMock: jest.Mock = jest.fn().mockResolvedValue({})
) {
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
              { id: "lbl-ops", name: "Brikette/Outbound/Operations" },
            ],
          },
        }),
        create: jest.fn(),
      },
    },
  };

  return { gmail, modifyMessageMock };
}

describe("guest email activity helper", () => {
  let tmpDir: string;
  let auditLogPath: string;

  beforeEach(() => {
    clearGuestEmailTemplateCache();
    jest.resetAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "guest-activity-test-"));
    auditLogPath = path.join(tmpDir, "email-audit-log.jsonl");
    process.env.AUDIT_LOG_PATH = auditLogPath;
  });

  afterEach(() => {
    delete process.env.AUDIT_LOG_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates agreement-received draft for activity code 21", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-21", message: { id: "msg-21" } } });
    const { gmail, modifyMessageMock } = buildGuestActivityGmailMock(createDraftMock);

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await sendGuestEmailActivity({
      bookingRef: "BOOK123",
      activityCode: 21,
      recipients: ["guest@example.com"],
    });

    expect(result).toMatchObject({
      success: true,
      status: "drafted",
      subject: "Agreement Received",
      draftId: "draft-21",
      messageId: "msg-21",
    });

    const raw = createDraftMock.mock.calls[0][0].requestBody.message.raw as string;
    const decoded = decodeRawEmail(raw);
    expect(decoded).toContain("Subject: Agreement Received");
    expect(decoded).toContain("we have received your agreement to the terms and conditions");
    expect(modifyMessageMock).toHaveBeenCalledWith({
      userId: "me",
      id: "msg-21",
      requestBody: {
        addLabelIds: expect.arrayContaining([
          "lbl-ready",
          "lbl-drafted",
          "lbl-human",
          "lbl-ops",
        ]),
      },
    });

    const telemetryLines = fs
      .readFileSync(auditLogPath, "utf-8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as { event_key?: string; source_path?: string; tool_name?: string });
    expect(telemetryLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_key: "email_draft_created",
          source_path: "reception",
          tool_name: "guest_email_activity",
        }),
      ]),
    );
  });

  it("selects hostelworld first-attempt template for code 5 when bookingRef starts with 7763-", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-5", message: { id: "msg-5" } } });
    const { gmail } = buildGuestActivityGmailMock(createDraftMock);

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await sendGuestEmailActivity({
      bookingRef: "7763-123456789",
      activityCode: 5,
      recipients: ["guest@example.com"],
    });

    expect(result).toMatchObject({
      success: true,
      status: "drafted",
      subject: "Prepayment - 1st Attempt Failed (Hostelworld)",
      prepaymentProvider: "hostelworld",
    });

    const raw = createDraftMock.mock.calls[0][0].requestBody.message.raw as string;
    const decoded = decodeRawEmail(raw);
    expect(decoded).toContain("Subject: Prepayment - 1st Attempt Failed (Hostelworld)");
  });

  it("strips legacy text signature lines from template bodies", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-8", message: { id: "msg-8" } } });
    const { gmail } = buildGuestActivityGmailMock(createDraftMock);

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await sendGuestEmailActivity({
      bookingRef: "BOOK123",
      activityCode: 8,
      recipients: ["guest@example.com"],
    });

    const raw = createDraftMock.mock.calls[0][0].requestBody.message.raw as string;
    const decoded = decodeRawEmail(raw);

    expect(decoded).not.toContain("Warm regards,");
    expect(decoded).not.toContain("Peter Cowling");
    expect(decoded).not.toContain("Owner");
  });

  it("defers unsupported activity codes without creating drafts", async () => {
    const result = await sendGuestEmailActivity({
      bookingRef: "BOOK123",
      activityCode: 2,
      recipients: ["guest@example.com"],
    });

    expect(result).toMatchObject({
      success: true,
      status: "deferred",
      reason: "unsupported-activity-code",
    });
    expect(getGmailClientMock).not.toHaveBeenCalled();

    const telemetryLines = fs
      .readFileSync(auditLogPath, "utf-8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as { event_key?: string; source_path?: string; reason?: string });
    expect(telemetryLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_key: "email_draft_deferred",
          source_path: "reception",
          reason: "unsupported-activity-code",
        }),
      ]),
    );
  });

  it("returns preview in dry-run mode without creating Gmail drafts", async () => {
    const result = await sendGuestEmailActivity({
      bookingRef: "BOOK123",
      activityCode: 21,
      recipients: ["guest@example.com"],
      dryRun: true,
    });

    expect(result).toMatchObject({
      success: true,
      status: "drafted",
      subject: "Agreement Received",
      reason: "dry-run-no-draft-created",
      dryRun: true,
      preview: {
        subject: "Agreement Received",
      },
    });
    expect(result.preview?.bodyPlain).toContain(
      "we have received your agreement to the terms and conditions"
    );
    expect(getGmailClientMock).not.toHaveBeenCalled();
  });

  // TASK-04: Wire activity code 27 to MCP email trigger
  it("creates cancellation confirmation draft for activity code 27", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-27", message: { id: "msg-27" } } });
    const { gmail } = buildGuestActivityGmailMock(createDraftMock);

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    const result = await sendGuestEmailActivity({
      bookingRef: "BOOK123",
      activityCode: 27,
      recipients: ["guest@example.com"],
    });

    // TC-01: Call sendGuestEmailActivity with code 27 → returns draft with cancellation template
    expect(result).toMatchObject({
      success: true,
      status: "drafted",
      subject: "Cancellation Confirmation",
      draftId: "draft-27",
      messageId: "msg-27",
    });

    const raw = createDraftMock.mock.calls[0][0].requestBody.message.raw as string;
    const decoded = decodeRawEmail(raw);

    // TC-02: Draft subject matches "Cancellation Confirmation"
    expect(decoded).toContain("Subject: Cancellation Confirmation");

    // TC-03: Draft body contains "We have received your cancellation request"
    expect(decoded).toContain("We have received your cancellation request");
  });

  it("returns cancellation preview in dry-run mode for code 27", async () => {
    const result = await sendGuestEmailActivity({
      bookingRef: "BOOK123",
      activityCode: 27,
      recipients: ["guest@example.com"],
      dryRun: true,
    });

    expect(result).toMatchObject({
      success: true,
      status: "drafted",
      subject: "Cancellation Confirmation",
      reason: "dry-run-no-draft-created",
      dryRun: true,
      preview: {
        subject: "Cancellation Confirmation",
      },
    });
    expect(result.preview?.bodyPlain).toContain(
      "We have received your cancellation request"
    );
    expect(getGmailClientMock).not.toHaveBeenCalled();
  });

  it("TC-09-03: throws actionable error when guest-activity label mutation fails", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-fail", message: { id: "msg-fail" } } });
    const { gmail } = buildGuestActivityGmailMock(
      createDraftMock,
      jest.fn().mockRejectedValue(new Error("label mutation failed"))
    );

    getGmailClientMock.mockResolvedValue({ success: true, client: gmail });

    await expect(
      sendGuestEmailActivity({
        bookingRef: "BOOK123",
        activityCode: 21,
        recipients: ["guest@example.com"],
      })
    ).rejects.toThrow("Failed to apply draft outcome labels");
  });
});
