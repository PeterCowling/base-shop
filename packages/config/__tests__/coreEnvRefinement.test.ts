import { expect, describe, it, afterEach } from "@jest/globals";

const OLD_ENV = process.env;

afterEach(() => {
  jest.resetModules();
  process.env = OLD_ENV;
});

describe("coreEnvSchema refinement", () => {
  it("coerces boolean and number strings", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    process.env = {
      ...OLD_ENV,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    } as NodeJS.ProcessEnv;

    const parsed = coreEnvSchema.parse(process.env);
    expect(parsed.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(parsed.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
    expect(parsed.REVERSE_LOGISTICS_ENABLED).toBe(false);
    expect(parsed.REVERSE_LOGISTICS_INTERVAL_MS).toBe(2000);
    expect(parsed.LATE_FEE_ENABLED).toBe(true);
    expect(parsed.LATE_FEE_INTERVAL_MS).toBe(3000);
  });

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

  it("adds issues for malformed prefixed variables", async () => {
    const { depositReleaseEnvRefinement } = await import("../src/env/core");
    const ctx = { addIssue: jest.fn() } as any;

    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_FOO_ENABLED: "yes",
        REVERSE_LOGISTICS_BAR_INTERVAL_MS: "soon",
        LATE_FEE_BAZ_ENABLED: "maybe",
      },
      ctx,
    );

    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
        message: "must be true or false",
      }),
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["REVERSE_LOGISTICS_BAR_INTERVAL_MS"],
        message: "must be a number",
      }),
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["LATE_FEE_BAZ_ENABLED"],
        message: "must be true or false",
      }),
    );
  });
});
