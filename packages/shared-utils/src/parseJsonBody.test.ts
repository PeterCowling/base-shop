import { parseJsonBody } from './parseJsonBody';
import { z } from 'zod';

describe('parseJsonBody', () => {
  const schema = z.object({ foo: z.string() });

  it('parses text body and returns typed data', async () => {
    const req = {
      text: jest.fn().mockResolvedValue(JSON.stringify({ foo: 'bar' })),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '1mb');

    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
    if (result.success) {
      const foo: string = result.data.foo;
      expect(foo).toBe('bar');
    }
  });

  it('parses json body', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ foo: 'bar' }),
    } as unknown as Request;

    await expect(parseJsonBody(req, schema, '1mb')).resolves.toEqual({
      success: true,
      data: { foo: 'bar' },
    });
  });

  it('returns 413 when body exceeds limit', async () => {
    const payload = { foo: 'a'.repeat(11 * 1024) };
    const req = {
      json: jest.fn().mockResolvedValue(payload),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10kb');
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

    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('returns 400 when no body parser is available', async () => {
    const req = {} as Request;
    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });

  it('returns flattened schema errors', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ foo: 123 }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, 1024);
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      foo: ['Expected string, received number'],
    });
  });
});

