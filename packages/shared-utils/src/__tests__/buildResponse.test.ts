import { buildResponse, type ProxyResponse } from '../buildResponse';

describe('buildResponse', () => {
  it('returns a Response with correct status and decoded body on success', async () => {
    const message = 'all good';
    const body = Buffer.from(message).toString('base64');
    const proxyResponse: ProxyResponse = {
      response: {
        status: 200,
        headers: { 'content-type': 'text/plain' },
        body,
      },
    };

    const resp = buildResponse(proxyResponse);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toBe('text/plain');
    await expect(resp.text()).resolves.toBe(message);
  });

  it('handles missing message or data by returning an empty body', async () => {
    const proxyResponse: ProxyResponse = {
      response: {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      },
    };

    const resp = buildResponse(proxyResponse);
    expect(resp.status).toBe(500);
    await expect(resp.text()).resolves.toBe('');
  });

  it('preserves custom headers and content types', async () => {
    const text = 'hello world';
    const body = Buffer.from(text).toString('base64');
    const proxyResponse: ProxyResponse = {
      response: {
        status: 202,
        headers: {
          'x-test': '1',
          'content-type': 'text/plain',
          'x-other': '2',
        },
        body,
      },
    };

    const resp = buildResponse(proxyResponse);

    expect(resp.status).toBe(202);
    expect(resp.headers.get('x-test')).toBe('1');
    expect(resp.headers.get('content-type')).toBe('text/plain');
    expect(resp.headers.get('x-other')).toBe('2');
    await expect(resp.text()).resolves.toBe(text);
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

