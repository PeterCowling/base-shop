import { fetchJson } from '../fetchJson';
import { z } from 'zod';

describe('fetchJson', () => {
  beforeEach(() => {
    // @ts-expect-error - jest mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns parsed JSON validated by schema', async () => {
    const data = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });

    const schema = z.object({ message: z.string() });
    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).resolves.toEqual(data);
  });

  it('returns parsed JSON when only text is provided', async () => {
    const data = { ok: true };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });

    await expect(fetchJson('https://example.com')).resolves.toEqual(data);
  });

  it('throws ZodError when response body does not match schema', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ message: 123 })),
    });

    const schema = z.object({ message: z.string() });
    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).rejects.toBeInstanceOf(z.ZodError);
  });

  it('returns undefined for non-JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('not json'),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('throws ZodError for non-JSON responses with schema', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('not json'),
    });

    const schema = z.object({ message: z.string() });
    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).rejects.toBeInstanceOf(z.ZodError);
  });

  it('returns undefined for empty response bodies', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('throws ZodError on empty body with schema', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });

    const schema = z.object({ message: z.string() });
    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).rejects.toBeInstanceOf(z.ZodError);
  });

  it('returns undefined when response text rejects', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('returns parsed JSON when response provides json function', async () => {
    const data = { ok: true };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(data),
    });

    await expect(fetchJson('https://example.com')).resolves.toEqual(data);
  });

  it('returns undefined when response json rejects', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('rejects when fetch fails with a network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network down'));
    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Network down',
    );
  });

  it('throws status text when error response body is plain text', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: jest.fn().mockResolvedValue('server exploded'),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Bad Gateway',
    );
  });

  it('throws error message from JSON error payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ error: 'Custom message' })),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Custom message',
    );
  });

  it('uses JSON error message when status text is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: '',
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ error: 'Custom message' })),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Custom message',
    );
  });

  it('throws status text when error payload lacks error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'oops' })),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Internal Server Error',
    );
  });

  it('throws HTTP status code when status text is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: '',
      text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'oops' })),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('HTTP 500');
  });

  it('includes response body when status text is empty and body is plain text', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: '',
      text: jest.fn().mockResolvedValue('server exploded'),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'server exploded',
    );
  });

  it('falls back to HTTP status when statusText is undefined', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue(''),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('HTTP 404');
  });

  it('falls back to HTTP status when response text rejects and statusText is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 418,
      statusText: undefined,
      text: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('HTTP 418');
  });

  it('defaults to GET when no init is provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });

    await fetchJson('https://example.com');
    expect(global.fetch).toHaveBeenCalledWith('https://example.com', undefined);
  });

  it('supports POST with body and custom headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ ok: true })),
    });

    const schema = z.object({ ok: z.boolean() });

    await expect(
      fetchJson(
        'https://example.com',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Custom': 'yes',
          },
          body: JSON.stringify({ hi: 'there' }),
        },
        schema,
      ),
    ).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom': 'yes',
      },
      body: JSON.stringify({ hi: 'there' }),
    });
  });

  it('rejects with the same AbortError instance', async () => {
    const err = new DOMException('aborted', 'AbortError');
    (global.fetch as jest.Mock).mockRejectedValue(err);

    await expect(fetchJson('https://example.com')).rejects.toBe(err);
  });
});

