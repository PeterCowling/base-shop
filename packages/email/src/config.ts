import { coreEnv } from "@acme/config/env/core";
import { z } from "zod";

const emailSchema = z.string().email();

export function getDefaultSender(): string {
  const sender = coreEnv.CAMPAIGN_FROM || coreEnv.GMAIL_USER;
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
