import { parseJsonBody } from '../src/parseJsonBody';
import { z } from 'zod';

const schema = z.object({ foo: z.string() });

async function handler(req: Request) {
  const parsed = await parseJsonBody(req, schema, '1mb');
  if (!parsed.success) {
    return parsed.response;
  }
  return Response.json(parsed.data);
}

describe('parseJsonBody API route integration', () => {
  it('parses valid JSON and returns data', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ foo: 'bar' });
  });

  it('returns error for invalid JSON', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid}',
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('parses JSON without content-type header', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
    });
    // Remove the automatic content-type header set by the Request constructor
    req.headers.delete('content-type');
    const res = await handler(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ foo: 'bar' });
  });
});
