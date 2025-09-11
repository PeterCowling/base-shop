import { buildResponse, type ProxyResponse } from '../buildResponse';

describe('buildResponse', () => {
  it('decodes a base64 body and sets status and headers', async () => {
    const text = 'hello world';
    const proxy: ProxyResponse = {
      response: {
        status: 201,
        headers: { 'X-Test': 'abc' },
        body: Buffer.from(text).toString('base64'),
      },
    };

    const res = buildResponse(proxy);

    expect(res.status).toBe(201);
    expect(res.headers.get('X-Test')).toBe('abc');
    await expect(res.text()).resolves.toBe(text);
  });

  it('returns an empty body when none is provided', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 204,
        headers: { 'X-Test': 'abc' },
        body: undefined,
      },
    };

    const res = buildResponse(proxy);

    expect(res.status).toBe(204);
    await expect(res.text()).resolves.toBe('');
  });

  it('returns an empty body when body is null', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 200,
        headers: { 'X-Test': 'abc' },
        body: null,
      },
    };

    const res = buildResponse(proxy);

    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe('');
  });

  it('copies all headers from the proxy response', async () => {
    const proxy: ProxyResponse = {
      response: {
        status: 200,
        headers: { 'X-Test': 'abc', 'X-Other': 'def' },
        body: Buffer.from('hi').toString('base64'),
      },
    };

    const res = buildResponse(proxy);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Test')).toBe('abc');
    expect(res.headers.get('X-Other')).toBe('def');
  });

  it('decodes body and applies multiple headers', async () => {
    const json = JSON.stringify({ hello: 'world' });
    const proxy: ProxyResponse = {
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Extra': '42',
        },
        body: Buffer.from(json).toString('base64'),
      },
    };

    const res = buildResponse(proxy);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('X-Extra')).toBe('42');
    await expect(res.text()).resolves.toBe(json);
  });
});
