import { buildResponse, type ProxyResponse } from '../../buildResponse';

describe('buildResponse', () => {
  it('creates a Response with decoded body, status and headers', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 201,
        headers: { 'x-test': '1', 'content-type': 'text/plain' },
        body: Buffer.from('hello world').toString('base64'),
      },
    };
    const res = buildResponse(proxy);
    expect(res.status).toBe(201);
    expect(res.headers.get('x-test')).toBe('1');
    await expect(res.text()).resolves.toBe('hello world');
  });

  it('handles empty body and default headers', async () => {
    const proxy: ProxyResponse = {
      response: { status: 204, headers: {} },
    };
    const res = buildResponse(proxy);
    expect(res.status).toBe(204);
    expect([...res.headers.entries()]).toEqual([]);
    await expect(res.text()).resolves.toBe('');
  });

  it('parses JSON payloads via res.json()', async () => {
    const data = { ok: true };
    const proxy: ProxyResponse = {
      response: {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: Buffer.from(JSON.stringify(data)).toString('base64'),
      },
    };
    const res = buildResponse(proxy);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(data);
  });

  it('propagates body and headers for non-2xx status', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 400,
        headers: { 'x-test': '1', 'content-type': 'text/plain' },
        body: Buffer.from('bad').toString('base64'),
      },
    };
    const res = buildResponse(proxy);
    expect(res.status).toBe(400);
    expect(res.headers.get('x-test')).toBe('1');
    await expect(res.text()).resolves.toBe('bad');
  });

  it('overwrites earlier headers when keys conflict', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 200,
        headers: {
          'X-Test': '1',
          'x-test': '2',
          'content-type': 'text/plain',
        },
        body: Buffer.from('ok').toString('base64'),
      },
    };
    const res = buildResponse(proxy);
    expect(res.headers.get('x-test')).toBe('2');
    await expect(res.text()).resolves.toBe('ok');
  });
});

