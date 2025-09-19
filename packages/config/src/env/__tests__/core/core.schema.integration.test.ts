/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";

import { parseWithCoreSchema } from "./core.test-helpers.ts";

describe("core env schema integration", () => {
  it("reports missing redis token when SESSION_STORE=redis", () => {
    const parsed = parseWithCoreSchema({
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["UPSTASH_REDIS_REST_TOKEN"],
            message:
              "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
          }),
        ]),
      );
    }
  });

  it("requires SENDGRID_API_KEY when EMAIL_PROVIDER=sendgrid", () => {
    const parsed = parseWithCoreSchema({ EMAIL_PROVIDER: "sendgrid" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["SENDGRID_API_KEY"],
            message: "Required",
          }),
        ]),
      );
    }
  });

  it("propagates issues from auth and email schemas", () => {
    const parsed = parseWithCoreSchema({
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
      EMAIL_PROVIDER: "sendgrid",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["UPSTASH_REDIS_REST_TOKEN"],
            message:
              "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
          }),
          expect.objectContaining({
            path: ["SENDGRID_API_KEY"],
            message: "Required",
          }),
        ]),
      );
    }
  });
});
