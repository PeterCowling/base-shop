import { describe, it, expect } from "@jest/globals";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("coreEnvSchema AUTH_TOKEN_TTL normalization", () => {
  it.each([
    [30, undefined],
    ["30", "30s"],
    [" 30 ", "30s"],
    [" 45s ", "45s"],
    ["5 m", "5m"],
  ])("normalizes %p to %p", async (input, normalized) => {
    const { coreEnvSchema } = await import("../src/env/core");
    const { authEnvSchema } = await import("../src/env/auth");
    const refine = (coreEnvSchema as any)._def.effect.refinement as (
      env: Record<string, unknown>,
      ctx: { addIssue: () => void },
    ) => void;
    const spy = jest
      .spyOn(authEnvSchema, "safeParse")
      .mockReturnValue({ success: true, data: {} } as any);

    refine({ ...baseEnv, AUTH_TOKEN_TTL: input as any }, { addIssue: () => {} });

    const arg = spy.mock.calls[0][0] as Record<string, unknown>;
    if (normalized === undefined) {
      expect(arg).not.toHaveProperty("AUTH_TOKEN_TTL");
    } else {
      expect(arg).toHaveProperty("AUTH_TOKEN_TTL", normalized);
    }
    spy.mockRestore();
  });
});
