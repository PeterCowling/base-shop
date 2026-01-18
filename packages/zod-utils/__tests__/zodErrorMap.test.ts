jest.mock('zod', () => {
  const actual = jest.requireActual('zod');
  return {
    ...actual,
    z: { ...actual.z, setErrorMap: jest.fn(actual.z.setErrorMap) },
  };
});

import { z, ZodIssueCode, type ZodIssue, type ZodIssueOptionalMessage } from 'zod';
import { applyFriendlyZodMessages, friendlyErrorMap } from '../src/zodErrorMap';

describe('applyFriendlyZodMessages', () => {
  it('sets the global error map', () => {
    const spy = (z as any).setErrorMap as jest.Mock;
    applyFriendlyZodMessages();
    expect(spy).toHaveBeenCalledWith(friendlyErrorMap);
    expect(z.getErrorMap()).toBe(friendlyErrorMap);
  });
});

describe('friendlyErrorMap', () => {
  const ctx = { defaultError: 'Default error', data: undefined } as const;

  it('handles invalid_type with undefined', () => {
    const issue: ZodIssue = {
      code: ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      message: '',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Required');
  });

  it('handles invalid_type with wrong type', () => {
    const issue: ZodIssue = {
      code: ZodIssueCode.invalid_type,
      expected: 'number',
      received: 'string',
      message: '',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Expected number');
  });

  it('handles invalid_enum_value', () => {
    const issue: ZodIssueOptionalMessage = {
      code: ZodIssueCode.invalid_enum_value,
      options: ['a', 'b'],
      received: 'c',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Invalid value');
  });

  it('handles too_small string', () => {
    const issue: ZodIssueOptionalMessage = {
      code: ZodIssueCode.too_small,
      minimum: 2,
      inclusive: true,
      type: 'string',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Must be at least 2 characters');
  });

  it('handles too_small array', () => {
    const issue: ZodIssueOptionalMessage = {
      code: ZodIssueCode.too_small,
      minimum: 1,
      inclusive: true,
      type: 'array',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Must have at least 1 items');
  });

  it('handles too_big string', () => {
    const issue: ZodIssueOptionalMessage = {
      code: ZodIssueCode.too_big,
      maximum: 3,
      inclusive: true,
      type: 'string',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Must be at most 3 characters');
  });

  it('handles too_big array', () => {
    const issue: ZodIssueOptionalMessage = {
      code: ZodIssueCode.too_big,
      maximum: 4,
      inclusive: true,
      type: 'array',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Must have at most 4 items');
  });

  it('uses issue.message in default case', () => {
    const issue: ZodIssueOptionalMessage = {
      code: ZodIssueCode.custom,
      message: 'Boom',
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe('Boom');
  });

  it('falls back to ctx.defaultError', () => {
    const issue: ZodIssueOptionalMessage = { code: ZodIssueCode.custom, path: [] };
    expect(friendlyErrorMap(issue, ctx).message).toBe(ctx.defaultError);
  });
});
