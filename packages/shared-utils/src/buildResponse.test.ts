import { buildResponse, type ProxyResponse } from './buildResponse';

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

  it('creates a Response with JSON body and error status', async () => {
    const body = { error: 'fail' };
    const proxy: ProxyResponse = {
      response: {
        status: 400,
        headers: { 'content-type': 'application/json', 'x-test': '1' },
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
      },
    };
    const res = buildResponse(proxy);
    expect(res.status).toBe(400);
    expect(res.headers.get('x-test')).toBe('1');
    await expect(res.json()).resolves.toEqual(body);
  });
});

