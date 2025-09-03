import { parseJsonBody, parseLimit } from '../parseJsonBody';
import { z } from 'zod';

describe('parseLimit', () => {
  it('returns numeric limits as-is', () => {
    expect(parseLimit(500)).toBe(500);
  });

  it('parses valid size strings', () => {
    expect(parseLimit('10kb')).toBe(10 * 1024);
    expect(parseLimit('2GB')).toBe(2 * 1024 * 1024 * 1024);
    expect(parseLimit('512b')).toBe(512);
  });

  it('accepts uppercase and mixed-case inputs', () => {
    expect(parseLimit('1MB')).toBe(1 * 1024 * 1024);
    expect(parseLimit('1mb')).toBe(1 * 1024 * 1024);
    expect(parseLimit('1Mb')).toBe(1 * 1024 * 1024);
  });

  it('throws on invalid strings', () => {
    expect(() => parseLimit('abc')).toThrow('Invalid limit');
  });
});

describe('parseJsonBody', () => {
  const schema = z.object({ foo: z.string() });

  it('parses text body within limit', async () => {
    const req = { text: jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' })) } as unknown as Request;
    await expect(parseJsonBody(req, schema, 1024)).resolves.toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('rejects text body over limit', async () => {
    const large = JSON.stringify({ foo: 'a'.repeat(2048) });
    const req = { text: jest.fn().mockResolvedValue(large) } as unknown as Request;
    const result = await parseJsonBody(req, schema, 100);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({ error: 'Payload Too Large' });
  });

  it('parses json body within limit', async () => {
    const req = { json: jest.fn().mockResolvedValue({ foo: 'bar' }) } as unknown as Request;
    await expect(parseJsonBody(req, schema, '10kb')).resolves.toEqual({ success: true, data: { foo: 'bar' } });
  });

  it('rejects json body over limit', async () => {
    const payload = { foo: 'a'.repeat(11 * 1024) };
    const req = { json: jest.fn().mockResolvedValue(payload) } as unknown as Request;
    const result = await parseJsonBody(req, schema, '10kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({ error: 'Payload Too Large' });
  });

  it('returns 400 for invalid JSON', async () => {
    const req = { text: jest.fn().mockResolvedValue('{invalid') } as unknown as Request;
    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 for empty body', async () => {
    const req = { text: jest.fn().mockResolvedValue('') } as unknown as Request;
    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 for invalid limit', async () => {
    const req = { text: jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' })) } as unknown as Request;
    const result = await parseJsonBody(req, schema, 'abc');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 when no body parser is available', async () => {
    const req = {} as Request;
    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns flattened schema errors', async () => {
    const req = { json: jest.fn().mockResolvedValue({ foo: 123 }) } as unknown as Request;
    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ foo: ['Expected string, received number'] });
  });
});

