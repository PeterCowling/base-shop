/** @jest-environment node */

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

describe("guest email activity helper", () => {
  beforeEach(() => {
    clearGuestEmailTemplateCache();
    jest.resetAllMocks();
  });

  it("creates agreement-received draft for activity code 21", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-21", message: { id: "msg-21" } } });
    const gmail = {
      users: {
        drafts: {
          create: createDraftMock,
        },
      },
    };

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
  });

  it("selects hostelworld first-attempt template for code 5 when bookingRef starts with 7763-", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-5", message: { id: "msg-5" } } });
    const gmail = {
      users: {
        drafts: {
          create: createDraftMock,
        },
      },
    };

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
});
