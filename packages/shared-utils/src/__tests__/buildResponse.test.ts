import { buildResponse, type ProxyResponse } from '../buildResponse';

describe('buildResponse', () => {
  it('decodes base64 body and preserves multiple headers', async () => {
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
});

