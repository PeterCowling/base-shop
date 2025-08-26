import { coreEnv } from "@acme/config/env/core";
import { z } from "zod";

const emailSchema = z.string().email();

export function getDefaultSender(): string {
  // Prefer reading directly from process.env to allow tests or runtime code
  // to set environment variables after the initial configuration module has
  // been imported. Falling back to values from `coreEnv` preserves the existing
  // behaviour when variables are static.
  const sender =
    process.env.CAMPAIGN_FROM ||
    process.env.GMAIL_USER ||
    coreEnv.CAMPAIGN_FROM ||
    coreEnv.GMAIL_USER;
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
