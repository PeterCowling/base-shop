import { jest } from "@jest/globals";
import { z } from "zod";
import {
  coreEnvBaseSchema,
  coreEnvSchema,
  depositReleaseEnvRefinement,
  loadCoreEnv,
} from "../../core.ts";

export const baseCoreEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
} as const;

export const depositSchema = coreEnvBaseSchema.superRefine(
  depositReleaseEnvRefinement,
);

export const parseWithDepositSchema = (overrides: Record<string, unknown> = {}) =>
  depositSchema.safeParse({ ...baseCoreEnv, ...overrides });

export const parseWithCoreSchema = (overrides: Record<string, unknown> = {}) =>
  coreEnvSchema.safeParse({ ...baseCoreEnv, ...overrides });

export const createRefinementCtx = () =>
  ({ addIssue: jest.fn() } as unknown as z.RefinementCtx);

export const loadCoreEnvWith = (overrides: Record<string, unknown>) =>
  loadCoreEnv({ ...baseCoreEnv, ...overrides } as NodeJS.ProcessEnv);
