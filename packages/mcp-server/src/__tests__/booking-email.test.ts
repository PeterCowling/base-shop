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

  it("sends booking email with occupant links", async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: { id: "msg-1" } });
    const gmail = {
      users: {
        messages: {
          send: sendMock,
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
    expect(sendMock).toHaveBeenCalledWith({
      userId: "me",
      requestBody: { raw: expect.any(String) },
    });

    const raw = sendMock.mock.calls[0][0].requestBody.raw as string;
    const decoded = decodeRawEmail(raw);

    expect(decoded).toContain("To: guest@example.com");
    expect(decoded).toContain("Subject: Your booking details (BOOK123)");
    expect(decoded).toContain("Guest 1: https://example.com/occ1");
    expect(decoded).toContain("Guest 2: https://example.com/occ2");
  });
});
