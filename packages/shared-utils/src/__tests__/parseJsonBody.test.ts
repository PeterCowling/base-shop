import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { parseJsonBody } from '../parseJsonBody';
import { z } from 'zod';

// Helper to access internal parseLimit function
function getParseLimit() {
  const file = fs.readFileSync(path.join(__dirname, '../parseJsonBody.ts'), 'utf8');
  const start = file.indexOf('function parseLimit');
  const end = file.indexOf('export async function parseJsonBody');
  const tsCode = file.slice(start, end);
  const jsCode = ts.transpile(tsCode);
  // eslint-disable-next-line no-new-func
  return new Function(`${jsCode}; return parseLimit;`)() as (limit: string | number) => number;
}

const parseLimit = getParseLimit();

describe('parseLimit', () => {
  it('returns numeric limits as-is', () => {
    expect(parseLimit(500)).toBe(500);
  });

  it('parses valid size strings', () => {
    expect(parseLimit('10kb')).toBe(10 * 1024);
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

  it('returns flattened schema errors', async () => {
    const req = { json: jest.fn().mockResolvedValue({ foo: 123 }) } as unknown as Request;
    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ foo: ['Expected string, received number'] });
  });
});

