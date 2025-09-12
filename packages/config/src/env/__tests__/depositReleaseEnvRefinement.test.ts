/** @jest-environment node */
import { describe, expect, it, jest } from '@jest/globals';
import { z } from 'zod';
import {
  depositReleaseEnvSchema,
  depositReleaseEnvRefinement,
  DEPOSIT_RELEASE_PREFIX,
} from '../depositRelease.ts';

const schema = depositReleaseEnvSchema.superRefine(depositReleaseEnvRefinement);

describe('deposit release env refinement', () => {
  it('parses built-in variables', () => {
    const parsed = schema.safeParse({
      DEPOSIT_RELEASE_ENABLED: 'true',
      DEPOSIT_RELEASE_INTERVAL_MS: '1000',
    });
    expect(parsed.success).toBe(true);
  });

  it('reports issues for invalid built-in variables', () => {
    const parsed = schema.safeParse({
      DEPOSIT_RELEASE_ENABLED: 'maybe',
      DEPOSIT_RELEASE_INTERVAL_MS: 'soon',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['DEPOSIT_RELEASE_ENABLED'], message: 'must be true or false' }),
          expect.objectContaining({ path: ['DEPOSIT_RELEASE_INTERVAL_MS'], message: 'must be a number' }),
        ]),
      );
    }
  });

  it('reports issues for invalid prefixed vars', () => {
    const parsed = schema.safeParse({
      [`${DEPOSIT_RELEASE_PREFIX}OOPS_ENABLED`]: 'nope',
      [`${DEPOSIT_RELEASE_PREFIX}OOPS_INTERVAL_MS`]: 'later',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: [`${DEPOSIT_RELEASE_PREFIX}OOPS_ENABLED`],
            message: 'must be true or false',
          }),
          expect.objectContaining({
            path: [`${DEPOSIT_RELEASE_PREFIX}OOPS_INTERVAL_MS`],
            message: 'must be a number',
          }),
        ]),
      );
    }
  });

  it('parses valid prefixed vars', () => {
    const parsed = schema.safeParse({
      [`${DEPOSIT_RELEASE_PREFIX}GOOD_ENABLED`]: 'true',
      [`${DEPOSIT_RELEASE_PREFIX}GOOD_INTERVAL_MS`]: '1000',
    });
    expect(parsed.success).toBe(true);
  });

  it('validates prefixed custom variables', () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        [`${DEPOSIT_RELEASE_PREFIX}FOO_ENABLED`]: 'nope',
        [`${DEPOSIT_RELEASE_PREFIX}BAR_INTERVAL_MS`]: 'later',
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: [`${DEPOSIT_RELEASE_PREFIX}FOO_ENABLED`],
      message: 'must be true or false',
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: [`${DEPOSIT_RELEASE_PREFIX}BAR_INTERVAL_MS`],
      message: 'must be a number',
    });
  });

  it('accepts valid prefixed variables', () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        [`${DEPOSIT_RELEASE_PREFIX}GOOD_ENABLED`]: 'true',
        [`${DEPOSIT_RELEASE_PREFIX}GOOD_INTERVAL_MS`]: '1000',
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it('flags non-boolean ENABLED and accepts numeric INTERVAL_MS values', () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        [`${DEPOSIT_RELEASE_PREFIX}COUNT_ENABLED`]: 1 as any,
        [`${DEPOSIT_RELEASE_PREFIX}COUNT_INTERVAL_MS`]: 5000,
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: [`${DEPOSIT_RELEASE_PREFIX}COUNT_ENABLED`],
      message: 'must be true or false',
    });
    expect(ctx.addIssue).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated keys', () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement({ OTHER_FEATURE_ENABLED: 'yes' } as any, ctx);
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });
});
