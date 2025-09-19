/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { resetEmailEnv, withEmailEnv } from "./email.test-helpers";

afterEach(() => {
  resetEmailEnv();
  jest.clearAllMocks();
});

describe("email default sender", () => {
  it("normalizes sender when valid", async () => {
    await withEmailEnv(
      {
        CAMPAIGN_FROM: " Sender@Example.com ",
        GMAIL_USER: undefined,
      } as NodeJS.ProcessEnv,
      async () => {
        const { getDefaultSender } = await import(
          "../../../../email/src/config.ts"
        );
        expect(getDefaultSender()).toBe("sender@example.com");
      },
    );
  });

  it("throws when sender is invalid", async () => {
    await withEmailEnv(
      {
        CAMPAIGN_FROM: "invalid-email",
        GMAIL_USER: undefined,
      } as NodeJS.ProcessEnv,
      async () => {
        const { getDefaultSender } = await import(
          "../../../../email/src/config.ts"
        );
        expect(() => getDefaultSender()).toThrow(
          "Invalid sender email address: invalid-email",
        );
      },
    );
  });
});
