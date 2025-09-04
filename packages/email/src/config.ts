import "server-only";
import { z } from "zod";

const emailSchema = z.string().email().transform((v) => v.toLowerCase());

export function getDefaultSender(): string {
  const sender = (process.env.CAMPAIGN_FROM || process.env.GMAIL_USER || "").trim();
  if (!sender) {
    throw new Error(
      "Default sender email is required. Set CAMPAIGN_FROM or GMAIL_USER."
    );
  }
  const parsed = emailSchema.safeParse(sender);
  if (!parsed.success) {
    throw new Error(`Invalid sender email address: ${sender}`);
  }
  return parsed.data;
}
