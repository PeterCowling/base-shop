import { type ErrorSetter,jsonFieldHandler } from '@acme/lib/json';

describe('jsonFieldHandler', () => {
  it('parses JSON and clears errors', () => {
    let parsed: any;
    let errors: Record<string, string[]> = { field: ['Invalid JSON'] };
    const setErrors: ErrorSetter = (update) => {
      errors = typeof update === 'function' ? update(errors) : update;
    };
    const handler = jsonFieldHandler<{ a: number }>('field', (data) => {
      parsed = data;
    }, setErrors);
    handler({ target: { value: '{"a":1}' } } as any);
    expect(parsed).toEqual({ a: 1 });
    expect(errors).toEqual({});
  });

  it('records an error for invalid JSON', () => {
    let errors: Record<string, string[]> = {};
    const setErrors: ErrorSetter = (update) => {
      errors = typeof update === 'function' ? update(errors) : update;
    };
    const handler = jsonFieldHandler('field', () => {}, setErrors);
    handler({ target: { value: 'not json' } } as any);
    expect(errors).toEqual({ field: ['Invalid JSON'] });
  });
});
