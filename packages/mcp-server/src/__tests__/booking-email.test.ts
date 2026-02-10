/** @jest-environment node */

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
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates booking email draft with occupant links", async () => {
    const createDraftMock = jest
      .fn()
      .mockResolvedValue({ data: { id: "draft-1", message: { id: "msg-1" } } });
    const gmail = {
      users: {
        drafts: {
          create: createDraftMock,
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
  });
});
