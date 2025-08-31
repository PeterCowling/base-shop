import "server-only";
import { z } from "zod";

const emailSchema = z.string().email();

export function getDefaultSender(): string {
  const sender = process.env.CAMPAIGN_FROM || process.env.GMAIL_USER;
  if (!sender) {
    throw new Error(
      "Default sender email is required. Set CAMPAIGN_FROM or GMAIL_USER."
    );
  }
  if (!emailSchema.safeParse(sender).success) {
    throw new Error(`Invalid sender email address: ${sender}`);
  }
  return sender;
}
