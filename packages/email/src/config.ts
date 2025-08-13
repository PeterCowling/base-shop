import { coreEnv } from "@acme/config/env/core";
import { z } from "zod";

/**
 * Default sender address for campaign emails.
 *
 * Reads the CAMPAIGN_FROM environment variable and validates that it
 * contains a well-formed email address. A descriptive error is thrown when the
 * variable is missing or invalid.
 */
export const defaultFrom = (() => {
  const from = coreEnv.CAMPAIGN_FROM;
  if (!from) {
    throw new Error(
      "Missing CAMPAIGN_FROM environment variable. Set it to a valid sender email."
    );
  }

  const parsed = z.string().email().safeParse(from);
  if (!parsed.success) {
    throw new Error(`Invalid CAMPAIGN_FROM address: ${from}`);
  }

  return parsed.data;
})();

