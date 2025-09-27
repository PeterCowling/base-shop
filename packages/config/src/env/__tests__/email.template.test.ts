/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import fs from "node:fs";

import { resetEmailEnv, withEmailEnv } from "./email.test-helpers";

afterEach(() => {
  resetEmailEnv();
  jest.clearAllMocks();
});

describe("email template base path", () => {
  it("accepts existing base path", async () => {
    await withEmailEnv(
      { EMAIL_TEMPLATE_BASE_PATH: __dirname } as NodeJS.ProcessEnv,
      async () => {
        expect(
          fs.existsSync(process.env.EMAIL_TEMPLATE_BASE_PATH!), // eslint-disable-line security/detect-non-literal-fs-filename -- TEST-0001: path comes from controlled test env var
        ).toBe(true);
      },
    );
  });

  it("handles missing base path", async () => {
    await withEmailEnv(
      { EMAIL_TEMPLATE_BASE_PATH: "./non-existent-path" } as NodeJS.ProcessEnv,
      async () => {
        expect(
          fs.existsSync(process.env.EMAIL_TEMPLATE_BASE_PATH!), // eslint-disable-line security/detect-non-literal-fs-filename -- TEST-0001: path comes from controlled test env var
        ).toBe(false);
      },
    );
  });
});
