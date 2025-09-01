import { expect, describe, it, afterEach } from "@jest/globals";

const OLD_ENV = process.env;

afterEach(() => {
  jest.resetModules();
  process.env = OLD_ENV;
});

describe("coreEnvSchema refinement", () => {
  it("reports invalid env variables", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    process.env = {
      ...OLD_ENV,
      DEPOSIT_RELEASE_ENABLED: "notbool",
      REVERSE_LOGISTICS_INTERVAL_MS: "abc",
      LATE_FEE_INTERVAL_MS: "abc",
      DEPOSIT_RELEASE_FOO: "bar",
    } as NodeJS.ProcessEnv;

    const parsed = coreEnvSchema.safeParse(process.env);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["DEPOSIT_RELEASE_ENABLED"] }),
          expect.objectContaining({ path: ["REVERSE_LOGISTICS_INTERVAL_MS"] }),
          expect.objectContaining({ path: ["LATE_FEE_INTERVAL_MS"] }),
        ]),
      );
      expect(parsed.error.issues).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["DEPOSIT_RELEASE_FOO"] }),
        ]),
      );
    }
  });
});
