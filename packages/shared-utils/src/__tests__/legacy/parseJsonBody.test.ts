import { z } from 'zod';

import { parseJsonBody, parseLimit } from '../../parseJsonBody';

describe('parseLimit', () => {
  it.each([
    ['1b', 1],
    ['2kb', 2 * 1024],
    ['3mb', 3 * 1024 * 1024],
    ['4gb', 4 * 1024 * 1024 * 1024],
  ])('parses %s', (input, expected) => {
    expect(parseLimit(input)).toBe(expected);
  });

  it('throws on invalid strings', () => {
    expect(() => parseLimit('10tb')).toThrow('Invalid limit');
    expect(() => parseLimit('foobar')).toThrow('Invalid limit');
  });

  it('returns numeric limits directly', () => {
    expect(parseLimit(123)).toBe(123);
  });
});

describe('parseJsonBody', () => {
  const schema = z.object({ foo: z.string() });

  it('returns 400 for non-JSON content-type', async () => {
    const text = jest.fn().mockResolvedValue('foo');
    const req = {
      headers: new Headers({ 'Content-Type': 'text/plain' }),
      text,
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(text).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('returns 400 for invalid content-type parameters', async () => {
    const text = jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' }));
    const req = {
      headers: new Headers({ 'Content-Type': 'application/json; foo=bar' }),
      text,
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(text).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('uses text() when available', async () => {
    const req = {
      text: jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' })),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');

    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('falls back to json()', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ foo: 'bar' }),
    } as unknown as Request;

    await expect(parseJsonBody(req, schema, '1kb')).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
    });
  });

  it('accepts a numeric limit', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ foo: 'bar' }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, 1024);

    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('returns 413 when payload exceeds limit', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ foo: 'a'.repeat(2 * 1024) }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Payload Too Large',
    });
  });

  it('returns 413 when text() payload exceeds limit', async () => {
    const large = JSON.stringify({ foo: 'a'.repeat(2 * 1024) });
    const req = {
      text: jest.fn().mockResolvedValue(large),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Payload Too Large',
    });
  });
  it('returns 413 when payload exceeds numeric limit', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ foo: 'a'.repeat(2 * 1024) }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Payload Too Large',
    });
  });
  it('returns 400 for invalid JSON', async () => {
    const req = {
      text: jest.fn().mockResolvedValue('{invalid'),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('returns 400 when schema validation fails', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ foo: 123 }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      foo: ['Expected string, received number'],
    });
  });

  it('returns 400 when no body parser is available', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const req = {} as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
    expect(errorSpy).toHaveBeenCalled();
    const logged = (errorSpy.mock.calls[0]?.[0] ?? {}) as Error;
    expect(logged).toBeInstanceOf(Error);
    expect(logged.message).toBe('No body parser available');
    errorSpy.mockRestore();
  });

  it('returns 400 when text() rejects', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const req = {
      text: jest.fn().mockRejectedValue(new Error('boom')),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  describe.each(['GET', 'POST'] as const)('%s requests', (method) => {
    describe('Content-Type handling', () => {
      const cases = [
        {
          label: 'application/json',
          headers: { 'Content-Type': 'application/json' },
          ok: true,
        },
        { label: 'no Content-Type', headers: {}, ok: true },
        {
          label: 'incorrect Content-Type',
          headers: { 'Content-Type': 'text/plain' },
          ok: false,
        },
        {
          label: 'application/json with charset',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          ok: true,
        },
      ] as const;

      it.each(cases)('handles %s', async ({ headers, ok }) => {
        const req = {
          method,
          headers: new Headers(headers),
          text: jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' })),
        } as unknown as Request;

        const result = await parseJsonBody(req, schema, '1kb');

        if (ok) {
          expect(result).toEqual({ success: true, data: { foo: 'bar' } });
        } else {
          expect(result.success).toBe(false);
          expect(result.response.status).toBe(400);
          await expect(result.response.json()).resolves.toEqual({
            error: 'Invalid JSON',
          });
        }
      });
    });

    describe('body states', () => {
      const atLimitData = { foo: 'a'.repeat(10) };
      const atLimitBody = JSON.stringify(atLimitData);
      const atLimit = new TextEncoder().encode(atLimitBody).length;

      const cases = [
        {
          label: 'empty string',
          body: '',
          status: 400,
          error: { error: 'Invalid JSON' },
        },
        {
          label: 'whitespace-only string',
          body: '   ',
          status: 400,
          error: { error: 'Invalid JSON' },
        },
        {
          label: 'valid JSON',
          body: JSON.stringify({ foo: 'bar' }),
          data: { foo: 'bar' },
        },
        {
          label: 'invalid JSON',
          body: '{invalid',
          status: 400,
          error: { error: 'Invalid JSON' },
        },
        {
          label: 'JSON at size limit',
          body: atLimitBody,
          limit: atLimit,
          data: atLimitData,
        },
        { label: 'null', body: 'null', status: 400, error: {} },
        {
          label: 'undefined',
          body: undefined,
          status: 400,
          error: { error: 'Invalid JSON' },
        },
      ] as const;

      it.each(cases)('handles %s', async ({ body, limit = '1kb', data, status, error }) => {
        const req = {
          method,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          text: jest.fn().mockResolvedValue(body as any),
        } as unknown as Request;

        const result = await parseJsonBody(req, schema, limit);

        if (data) {
          expect(result).toEqual({ success: true, data });
        } else {
          expect(result.success).toBe(false);
          expect(result.response.status).toBe(status);
          await expect(result.response.json()).resolves.toEqual(error);
        }
      });
    });
  });

  it('rejects Content-Type with unsupported parameters', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8; gzip' },
      body: JSON.stringify({ foo: 'bar' }),
    });

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });
});

