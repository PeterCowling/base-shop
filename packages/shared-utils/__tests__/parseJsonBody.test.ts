import { parseJsonBody } from '../src/parseJsonBody';
import { z } from 'zod';

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

  it('falls back to json() for non-string bodies', async () => {
    const req = { json: async () => ({ foo: 'bar' }) } as unknown as Request;
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result).toEqual({ success: true, data: { foo: 'bar' } });
  });
});

