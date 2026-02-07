/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";
import { type z } from "zod";

import { authEnvSchema } from "../../auth.ts";
import { coreEnvSchema } from "../../core.ts";

import { baseCoreEnv } from "./core.test-helpers.ts";

describe("AUTH_TOKEN_TTL normalization", () => {
  it.each([
    [30, undefined],
    ["30", "30s"],
    [" 45s ", "45s"],
    ["5 m", "5m"],
  ])("normalizes %p to %p", async (input, normalized) => {
    const refine = (coreEnvSchema as any)._def.effect.refinement as (
      env: Record<string, unknown>,
      ctx: z.RefinementCtx,
    ) => void;
    const spy = jest
      .spyOn(authEnvSchema, "safeParse")
      .mockReturnValue({ success: true, data: {} } as any);
    refine({ ...baseCoreEnv, AUTH_TOKEN_TTL: input as any }, { addIssue: () => {} });
    const arg = spy.mock.calls[0][0] as Record<string, unknown>;
    if (normalized === undefined) {
      expect(arg).not.toHaveProperty("AUTH_TOKEN_TTL");
    } else {
      expect(arg).toHaveProperty("AUTH_TOKEN_TTL", normalized);
    }
    spy.mockRestore();
  });
});
