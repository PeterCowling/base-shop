import { type ErrorSetter, jsonFieldHandler } from '../jsonFieldHandler';

describe('jsonFieldHandler', () => {
  it('parses valid JSON and clears errors', () => {
    let parsed: any;
    let errors: Record<string, string[]> = {
      field: ['Invalid JSON'],
      other: ['Other error'],
    };
    const setErrors: ErrorSetter = (update) => {
      errors = typeof update === 'function' ? update(errors) : update;
    };

    const handler = jsonFieldHandler<{ a: number }>('field', (data) => {
      parsed = data;
    }, setErrors);

    handler({ target: { value: '{"a":1}' } } as any);

    expect(parsed).toEqual({ a: 1 });
    expect(errors).toEqual({ other: ['Other error'] });
  });

  it('sets an error on invalid JSON', () => {
    let errors: Record<string, string[]> = { other: ['Other error'] };
    const setErrors: ErrorSetter = (update) => {
      errors = typeof update === 'function' ? update(errors) : update;
    };

    const handler = jsonFieldHandler('field', () => {}, setErrors);

    handler({ target: { value: 'not json' } } as any);
    handler({ target: { value: 'still not json' } } as any);

    expect(errors.field).toEqual(['Invalid JSON']);
    expect(errors).toEqual({
      other: ['Other error'],
      field: ['Invalid JSON'],
    });
  });
});
