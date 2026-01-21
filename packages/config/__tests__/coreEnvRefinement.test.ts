import { describe, expect, it } from "@jest/globals";

describe("coreEnvSchema refinement", () => {
  it("coerces boolean and number strings", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    const parsed = coreEnvSchema.parse({
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    } as NodeJS.ProcessEnv);
    expect(parsed.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(parsed.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
    expect(parsed.REVERSE_LOGISTICS_ENABLED).toBe(false);
    expect(parsed.REVERSE_LOGISTICS_INTERVAL_MS).toBe(2000);
    expect(parsed.LATE_FEE_ENABLED).toBe(true);
    expect(parsed.LATE_FEE_INTERVAL_MS).toBe(3000);
  });

  it("reports invalid env variables", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    const parsed = coreEnvSchema.safeParse({
      DEPOSIT_RELEASE_ENABLED: "notbool",
      REVERSE_LOGISTICS_INTERVAL_MS: "abc",
      LATE_FEE_INTERVAL_MS: "abc",
      DEPOSIT_RELEASE_FOO: "bar",
    } as NodeJS.ProcessEnv);
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

  it("collects issues for invalid deposit, reverse and late fee strings", async () => {
    const { depositReleaseEnvRefinement } = await import("../src/env/core");
    const ctx = { addIssue: jest.fn() } as any;

    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "maybe",
        REVERSE_LOGISTICS_INTERVAL_MS: "abc",
        LATE_FEE_INTERVAL_MS: {} as any,
      },
      ctx,
    );

    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_ENABLED"],
        message: "must be true or false",
      }),
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["REVERSE_LOGISTICS_INTERVAL_MS"],
        message: "must be a number",
      }),
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["LATE_FEE_INTERVAL_MS"],
        message: "must be a number",
      }),
    );
  });

  it("reports issues for invalid boolean and number values", async () => {
    const { depositReleaseEnvRefinement } = await import("../src/env/core");
    const ctx = { addIssue: jest.fn() } as any;

    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "abc",
      },
      ctx,
    );

    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_ENABLED"],
        message: "must be true or false",
      }),
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_INTERVAL_MS"],
        message: "must be a number",
      }),
    );
  });

  it("ignores unrelated keys", async () => {
    const { depositReleaseEnvRefinement } = await import("../src/env/core");
    const ctx = { addIssue: jest.fn() } as any;

    depositReleaseEnvRefinement(
      {
        SOME_OTHER_KEY: "value",
        DEPOSIT_RELEASE_FOO: "bar",
      },
      ctx,
    );

    expect(ctx.addIssue).not.toHaveBeenCalled();
  });
});


const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("depositReleaseEnvRefinement via coreEnvSchema", () => {
  it("reports custom issue for invalid DEPOSIT_RELEASE_ENABLED", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "yes",
    } as NodeJS.ProcessEnv);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_ENABLED"],
            message: "must be true or false",
          }),
        ]),
      );
    }
  });

  it.each([
    ["DEPOSIT_RELEASE_INTERVAL_MS"],
    ["REVERSE_LOGISTICS_INTERVAL_MS"],
    ["LATE_FEE_INTERVAL_MS"],
  ])("reports custom issue for invalid %s", async (key) => {
    const { coreEnvSchema } = await import("../src/env/core");
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      [key]: "soon",
    } as Record<string, string>);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: [key], message: "must be a number" }),
        ]),
      );
    }
  });

  it("parses valid boolean and number strings", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    } as NodeJS.ProcessEnv);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.DEPOSIT_RELEASE_ENABLED).toBe(true);
      expect(parsed.data.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
      expect(parsed.data.REVERSE_LOGISTICS_ENABLED).toBe(false);
      expect(parsed.data.REVERSE_LOGISTICS_INTERVAL_MS).toBe(2000);
      expect(parsed.data.LATE_FEE_ENABLED).toBe(true);
      expect(parsed.data.LATE_FEE_INTERVAL_MS).toBe(3000);
    }
  });
});

describe("auth/email schema merge failures", () => {
  it("forwards auth schema issues", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      AUTH_TOKEN_TTL: "10x",
    } as NodeJS.ProcessEnv);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["AUTH_TOKEN_TTL"] }),
        ]),
      );
    }
  });

  it("forwards email schema issues", async () => {
    const { coreEnvSchema } = await import("../src/env/core");
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      EMAIL_PROVIDER: "mailchimp",
    } as NodeJS.ProcessEnv);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["EMAIL_PROVIDER"] }),
        ]),
      );
    }
  });
});
