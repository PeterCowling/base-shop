import "server-only";
import { z } from "zod";

const emailSchema = z.string().email().transform((v) => v.toLowerCase());

export function getDefaultSender(): string {
  const sender =
    process.env.CAMPAIGN_FROM?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    "";
  if (!sender) {
    throw new Error(
      "Default sender email is required. Set CAMPAIGN_FROM or GMAIL_USER." // i18n-exempt: developer configuration error
    );
  }
  const parsed = emailSchema.safeParse(sender);
  if (!parsed.success) {
    throw new Error(`Invalid sender email address: ${sender}`); // i18n-exempt: developer configuration error
  }
  return parsed.data;
}
