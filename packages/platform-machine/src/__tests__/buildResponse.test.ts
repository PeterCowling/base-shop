import { buildResponse, type ProxyResponse } from '@acme/lib/http/server';

describe('buildResponse', () => {
  it('builds OK response with JSON body and headers', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-test': '1' },
        body: Buffer.from(JSON.stringify({ ok: true })).toString('base64'),
      },
    };
    const res = buildResponse(proxy);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-test')).toBe('1');
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('builds error response merging headers and string body', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 400,
        headers: { 'X-Test': '1', 'x-test': '2' },
        body: Buffer.from('bad').toString('base64'),
      },
    };
    const res = buildResponse(proxy);
    expect(res.status).toBe(400);
    expect(res.headers.get('x-test')).toBe('2');
    await expect(res.text()).resolves.toBe('bad');
  });

  it('handles missing body and headers', async () => {
    const proxy: ProxyResponse = { response: { status: 204, headers: {} } };
    const res = buildResponse(proxy);
    expect(res.status).toBe(204);
    expect([...res.headers.entries()]).toEqual([]);
    await expect(res.text()).resolves.toBe('');
  });
});

