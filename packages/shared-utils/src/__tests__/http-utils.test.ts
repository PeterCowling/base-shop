import { fetchJson } from '../fetchJson';
import { buildResponse, type ProxyResponse } from '../buildResponse';
import { z } from 'zod';

describe('fetchJson', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('parses JSON and validates against schema', async () => {
    const data = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });

    const schema = z.object({ message: z.string() });
    await expect(fetchJson('https://example.com', undefined, schema)).resolves.toEqual(data);
  });

  it('returns undefined for empty response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('throws on invalid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('not json'),
    });

    const schema = z.object({ message: z.string() });
    await expect(fetchJson('https://example.com', undefined, schema)).rejects.toThrow();
  });

  it('reports error message for non-OK responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Oops' })),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('Oops');
  });

  it('falls back to status text when error payload is invalid', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: jest.fn().mockResolvedValue('not json'),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('Internal Server Error');
  });

  it('falls back to status code when status text is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 418,
      statusText: '',
      text: jest.fn().mockResolvedValue(
        JSON.stringify({ message: 'teapot' })
      ),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('HTTP 418');
  });
});

describe('buildResponse', () => {
  it('decodes base64 body and rehydrates headers', async () => {
    const text = 'hello world';
    const body = Buffer.from(text).toString('base64');
    const proxyResponse: ProxyResponse = {
      response: {
        status: 200,
        headers: { 'x-test': '1' },
        body,
      },
    };

    const resp = buildResponse(proxyResponse);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('x-test')).toBe('1');
    await expect(resp.text()).resolves.toBe(text);
  });
});
