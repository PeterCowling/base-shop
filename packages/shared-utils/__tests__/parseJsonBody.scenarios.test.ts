import { parseJsonBody } from '../src/parseJsonBody';
import { Readable } from 'node:stream';
import { z } from 'zod';

describe('parseJsonBody scenarios', () => {
  const schema = z.object({ a: z.number() });

  it('parses valid JSON', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"a":1}',
    });
    await expect(parseJsonBody(req, schema, '1mb')).resolves.toEqual({
      success: true,
      data: { a: 1 },
    });
  });

  it('handles empty body', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });

  it('handles malformed JSON', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });

  it('rejects non-json content type', async () => {
    const req = new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: '{"a":1}',
    });
    const result = await parseJsonBody(req, schema, '1mb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });

  it('parses JSON from stream bodies', async () => {
    const stream = Readable.from([Buffer.from(JSON.stringify({ a: 1 }))]);
    const req = new Request('http://test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stream,
    });
    await expect(parseJsonBody(req, schema, '1mb')).resolves.toEqual({
      success: true,
      data: { a: 1 },
    });
  });
});

