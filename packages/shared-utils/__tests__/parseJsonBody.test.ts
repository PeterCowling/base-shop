import { parseJsonBody, parseLimit } from '../src/parseJsonBody';
import { z } from 'zod';

describe('parseLimit', () => {
  it('parses limits with units', () => {
    expect(parseLimit('10kb')).toBe(10 * 1024);
    expect(parseLimit('2mb')).toBe(2 * 1024 * 1024);
  });

  it('throws for invalid inputs', () => {
    expect(() => parseLimit('oops')).toThrow('Invalid limit');
    expect(() => parseLimit('10')).toThrow('Invalid limit');
  });
});

describe('parseJsonBody', () => {
  const schema = z.object({ foo: z.string() });

  function makeRequest(body: string) {
    return new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  it('parses a valid JSON string body', async () => {
    const req = makeRequest(JSON.stringify({ foo: 'bar' }));
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('returns an error response for invalid JSON', async () => {
    const req = makeRequest('{invalid}');
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('returns an error response when json() throws a SyntaxError', async () => {
    const req = {
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Request;
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('falls back to json() for non-string bodies', async () => {
    const req = { json: async () => ({ foo: 'bar' }) } as unknown as Request;
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('rejects invalid content-type and drains body', async () => {
    const text = jest.fn().mockResolvedValue('ignored');
    const req = {
      headers: new Headers({ 'content-type': 'text/plain' }),
      text,
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10kb');
    expect(text).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 413 when body exceeds limit', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue({ foo: 'a'.repeat(20) }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10b');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({ error: 'Payload Too Large' });
  });

  it('returns flattened errors when schema validation fails', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue({ foo: 123 }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      foo: ['Expected string, received number'],
    });
  });

  it('handles missing body parsers', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1mb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });
});

