import { parseJsonBody } from '@acme/shared-utils/src/parseJsonBody';
import { z } from 'zod';

type HeadersInit = Record<string, string> | undefined;

function makeRequest(body: any, headers: HeadersInit = {}, mode: 'text' | 'json' = 'text') {
  const h = new Headers(headers);
  if (mode === 'json') {
    return { headers: h, json: jest.fn().mockResolvedValue(body) } as unknown as Request;
  }
  return { headers: h, text: jest.fn().mockResolvedValue(body) } as unknown as Request;
}

describe('parseJsonBody', () => {
  const schema = z.object({ foo: z.string() });

  let consoleSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns 400 for wrong content-type and drains body', async () => {
    const req = makeRequest('text', { 'Content-Type': 'text/plain' });
    const result = await parseJsonBody(req, schema, '1kb');
    expect((req as any).text).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 when schema validation fails via json()', async () => {
    const req = makeRequest({}, { 'Content-Type': 'application/json' }, 'json');
    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ foo: ['Required'] });
  });

  it('returns 400 for invalid JSON via text()', async () => {
    const req = makeRequest('{oops', { 'Content-Type': 'application/json' });
    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 413 when payload exceeds limit', async () => {
    const req = makeRequest({ foo: 'bar' }, { 'Content-Type': 'application/json' }, 'json');
    const Original = TextEncoder;
    class MockEncoder extends TextEncoder {
      encode(_: string): Uint8Array {
        return new Uint8Array(11); // always 11 bytes
      }
    }
    // @ts-expect-error overriding global
    global.TextEncoder = MockEncoder;
    try {
      const result = await parseJsonBody(req, schema, 10);
      expect(result.success).toBe(false);
      expect(result.response.status).toBe(413);
      await expect(result.response.json()).resolves.toEqual({ error: 'Payload Too Large' });
    } finally {
      global.TextEncoder = Original;
    }
  });

  it('parses valid JSON within limit', async () => {
    const req = makeRequest('{"foo":"bar"}', { 'Content-Type': 'application/json' });
    await expect(parseJsonBody(req, schema, '1kb')).resolves.toEqual({ success: true, data: { foo: 'bar' } });
  });

  it.each([{}, { 'Content-Type': 'application/json' }])('handles missing body with headers %p', async (headers) => {
    const req = makeRequest(undefined, headers);
    const result = await parseJsonBody(req, schema, '1kb');
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });
});

