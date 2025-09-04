import { parseJsonBody } from '../parseJsonBody';
import { z } from 'zod';

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

  it('returns 413 when application/json body exceeds limit', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: jest.fn().mockResolvedValue({ foo: 'a'.repeat(20) }),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10b');

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toEqual({ error: 'Payload Too Large' });
  });

  it('returns 400 for invalid JSON via text', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValue('{invalid'),
    } as unknown as Request;

    const result = await parseJsonBody(req, schema, '10kb');

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
});
