import { z } from 'zod';

import { parseJsonBody, parseLimit } from './parseJsonBody';

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
    const req = {} as Request;

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('parses valid JSON when Content-Type is application/json', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });

    await expect(parseJsonBody(req, schema, '1kb')).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
    });
  });

  it('rejects mismatched Content-Type', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ foo: 'bar' }),
    });

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('returns 400 when body is empty', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('returns 400 when body is undefined', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('accepts Content-Type with charset parameter', async () => {
    const req = new Request('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ foo: 'bar' }),
    });

    await expect(parseJsonBody(req, schema, '1kb')).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
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

