import { buildResponse } from '../buildResponse';

describe('buildResponse', () => {
  it('decodes base64 body and rehydrates headers', async () => {
    const text = 'hello world';
    const body = Buffer.from(text).toString('base64');
    const resp = buildResponse({
      response: { status: 200, headers: { 'x-test': '1' }, body },
    });

    expect(resp.status).toBe(200);
    expect(resp.headers.get('x-test')).toBe('1');
    await expect(resp.text()).resolves.toBe(text);
  });
});
