import { z } from "zod";

import { getGmailClient } from "../clients/gmail.js";
import { createRawEmail } from "../utils/email-mime.js";
import { generateEmailHtml } from "../utils/email-template.js";
import { errorResult, formatError, jsonResult } from "../utils/validation.js";

const bookingEmailSchema = z.object({
  bookingRef: z.string().min(1),
  recipients: z.array(z.string().email()).min(1),
  occupantLinks: z.array(z.string().min(1)).min(1),
  subject: z.string().min(1).optional(),
});

export type BookingEmailInput = z.infer<typeof bookingEmailSchema>;

export const bookingEmailTools = [
  {
    name: "mcp_send_booking_email",
    description: "Send booking app-link emails via Gmail using MCP tooling.",
    inputSchema: {
      type: "object",
      properties: {
        bookingRef: { type: "string", description: "Booking reference" },
        recipients: {
          type: "array",
          items: { type: "string" },
          description: "Recipient email addresses",
        },
        occupantLinks: {
          type: "array",
          items: { type: "string" },
          description: "Booking/app links for each occupant",
        },
        subject: { type: "string", description: "Optional email subject" },
      },
      required: ["bookingRef", "recipients", "occupantLinks"],
    },
  },
] as const;

export interface BookingEmailResult {
  success: boolean;
  messageId?: string;
  subject: string;
  recipients: string[];
  bookingRef: string;
}

export async function sendBookingEmail(
  input: BookingEmailInput
): Promise<BookingEmailResult> {
  const { bookingRef, recipients, occupantLinks, subject } = bookingEmailSchema.parse(
    input
  );

  const bodyLines = [
    "Hello,",
    "",
    "Here are your booking links for online check-in:",
    ...occupantLinks.map((link, index) => `Guest ${index + 1}: ${link}`),
    "",
    "If you have any questions, just reply to this email.",
    "",
    "Best regards,",
    "Hostel Brikette",
  ];

  const bodyText = bodyLines.join("\n");
  const subjectText = subject ?? `Your booking details (${bookingRef})`;
  const bodyHtml = generateEmailHtml({
    recipientName: undefined,
    bodyText,
    includeBookingLink: false,
    subject: subjectText,
  });

  const clientResult = await getGmailClient();
  if (!clientResult.success) {
    if (clientResult.needsSetup) {
      throw new Error(
        `Gmail not configured. ${clientResult.error}\n\n` +
          `To set up Gmail:\n` +
          `1. Create OAuth credentials in Google Cloud Console\n` +
          `2. Save credentials.json to packages/mcp-server/\n` +
          `3. Run: cd packages/mcp-server && node --loader ts-node/esm test-gmail-auth.ts`
      );
    }
    throw new Error(clientResult.error);
  }

  const gmail = clientResult.client;
  const raw = createRawEmail(recipients.join(", "), subjectText, bodyText, bodyHtml);

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return {
    success: true,
    messageId: response.data?.id || undefined,
    subject: subjectText,
    recipients,
    bookingRef,
  };
}

export async function handleBookingEmailTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "mcp_send_booking_email": {
        const result = await sendBookingEmail(args as BookingEmailInput);
        return jsonResult(result);
      }
      default:
        return errorResult(`Unknown booking email tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
