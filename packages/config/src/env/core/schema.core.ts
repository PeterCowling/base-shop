import { z } from "zod";

import { authEnvSchema } from "@acme/config/env/auth";

import { emailEnvSchema } from "../email.schema.js";

import { AUTH_TTL_META_SYMBOL } from "./constants.js";
import { depositReleaseEnvRefinement } from "./refinement.deposit.js";
import { coreEnvPreprocessedSchema } from "./schema.preprocess.js";

export const coreEnvSchema = coreEnvPreprocessedSchema.superRefine((
  env: unknown,
  ctx: z.RefinementCtx,
) => {
  depositReleaseEnvRefinement(env as Record<string, unknown>, ctx);

  // Normalize AUTH_TOKEN_TTL before delegating to the auth schema so builds
  // don't fail if the value is provided as a plain number or contains
  // incidental whitespace.
  const envForAuth: Record<string, unknown> = {
    ...(env as Record<string, unknown>),
  };
  const rawTtl = envForAuth.AUTH_TOKEN_TTL;
  const globalFlagged = (globalThis as Record<string, unknown>)
    .__ACME_NON_STRING_ENV__;
  const ttlWasNonString =
    (env as Record<symbol, unknown>)[AUTH_TTL_META_SYMBOL] === true ||
    typeof rawTtl === "number" ||
    (Array.isArray(globalFlagged) && globalFlagged.includes("AUTH_TOKEN_TTL"));

  if (ttlWasNonString) {
    delete envForAuth.AUTH_TOKEN_TTL;
  }

  if (!ttlWasNonString && typeof rawTtl === "string") {
    const trimmed = rawTtl.trim();
    if (trimmed === "") {
      delete envForAuth.AUTH_TOKEN_TTL;
    } else if (/^\d+$/.test(trimmed)) {
      envForAuth.AUTH_TOKEN_TTL = `${trimmed}s`;
    } else if (/^(\d+)\s*([sm])$/i.test(trimmed)) {
      const [, num, unit] = trimmed.match(/^(\d+)\s*([sm])$/i)!;
      envForAuth.AUTH_TOKEN_TTL = `${num}${unit.toLowerCase()}`;
    }
  }

  delete (env as Record<symbol, unknown>)[AUTH_TTL_META_SYMBOL];

  const authResult = authEnvSchema.safeParse(envForAuth);
  if (authResult.success) {
    (env as Record<string, unknown>).AUTH_TOKEN_TTL =
      authResult.data.AUTH_TOKEN_TTL;
  } else {
    authResult.error.issues.forEach((issue: z.ZodIssue) => {
      const { code, ...rest } = issue;
      ctx.addIssue({
        ...(rest as Record<string, unknown>),
        code: code ?? z.ZodIssueCode.custom,
      } as z.ZodIssue);
    });
  }

  const emailResult = emailEnvSchema.safeParse(env);
  if (!emailResult.success) {
    emailResult.error.issues.forEach((issue: z.ZodIssue) => {
      const { code, ...rest } = issue;
      ctx.addIssue({
        ...(rest as Record<string, unknown>),
        code: code ?? z.ZodIssueCode.custom,
      } as z.ZodIssue);
    });
  }
});

export type CoreEnv = z.infer<typeof coreEnvSchema>;
