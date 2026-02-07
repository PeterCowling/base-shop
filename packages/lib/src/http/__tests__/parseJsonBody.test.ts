/**
 * @jest-environment node
 */
import { z } from 'zod';

import { parseJsonBody } from '../parseJsonBody.server';
import { parseLimit } from '../parseLimit';

describe('parseJsonBody', () => {
  const schema = z.object({ foo: z.string() });

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

  it('rejects application/json with unexpected parameters and drains body', async () => {
    const text = jest.fn().mockResolvedValue('ignored');
    const req = {
      headers: new Headers({ 'content-type': 'application/json; foo=bar' }),
      text,
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10kb');

    expect(text).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('parses valid JSON without content-type header', async () => {
    const req = {
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({ foo: 'bar' }),
    } as unknown as Request;

    await expect(parseJsonBody(req, schema, '10kb')).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
    });
  });

  it('parses application/json with charset parameter', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
      json: jest.fn().mockResolvedValue({ foo: 'bar' }),
    } as unknown as Request;

    await expect(parseJsonBody(req, schema, '10kb')).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
    });
  });

  it('returns 413 when application/json body exceeds limit', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue({ foo: 'a'.repeat(20) }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, parseLimit('10b'));

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({ error: 'Payload Too Large' });
  });

  it('returns 400 for invalid JSON via text', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValue('{invalid'),
    } as unknown as Request;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await parseJsonBody(req, schema, '10kb');
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 for empty body text', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValue(''),
    } as unknown as Request;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await parseJsonBody(req, schema, '10kb');
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 when reading the body throws', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockRejectedValue(new Error('boom')),
    } as unknown as Request;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await parseJsonBody(req, schema, '10kb');
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 when json parser throws', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockRejectedValue(new Error('boom')),
    } as unknown as Request;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await parseJsonBody(req, schema, '10kb');
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns flattened errors when JSON fails schema', async () => {
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

  it('parses valid JSON under limit', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue({ foo: 'bar' }),
    } as unknown as Request;

    await expect(parseJsonBody(req, schema, '10kb')).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
    });
  });

  it('supports numeric limit values', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue({ foo: 'bar' }),
    } as unknown as Request;

    await expect(parseJsonBody(req, schema, 1000)).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
    });
  });

  it('prefers text parser when both text and json are present', async () => {
    const text = jest.fn().mockResolvedValue('{"foo":"bar"}');
    const json = jest.fn();
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text,
      json,
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10kb');

    expect(text).toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('returns 413 when text body exceeds limit', async () => {
    const largeBody = '{"foo":"' + 'a'.repeat(20) + '"}';
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValue(largeBody),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10b');

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({ error: 'Payload Too Large' });
  });

  it('returns 400 when no body parser is available', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
    } as unknown as Request;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await parseJsonBody(req, schema, '10kb');
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });
});

describe('parseLimit', () => {
  it('returns numeric limits unchanged', () => {
    expect(parseLimit(123)).toBe(123);
  });

  it('parses limit strings with units', () => {
    expect(parseLimit('10b')).toBe(10);
    expect(parseLimit('10kb')).toBe(10 * 1024);
    expect(parseLimit('10mb')).toBe(10 * 1024 * 1024);
    expect(parseLimit('10gb')).toBe(10 * 1024 * 1024 * 1024);
  });

  it('parses uppercase units', () => {
    expect(parseLimit('5KB')).toBe(5 * 1024);
  });

  it('throws on invalid limit string', () => {
    expect(() => parseLimit('invalid')).toThrow('Invalid limit');
  });
});
