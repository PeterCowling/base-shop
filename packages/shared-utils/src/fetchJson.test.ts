import { fetchJson } from './fetchJson';
import { z } from 'zod';

describe('fetchJson', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns parsed data on success', async () => {
    const data = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });

    await expect(fetchJson<typeof data>('https://example.com')).resolves.toEqual(data);
  });

  it('throws error for non-OK responses with JSON payload', async () => {
    const payload = { error: 'Bad Request' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      status: 400,
      text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('Bad Request');
  });

  it('returns undefined when response body is invalid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('not json'),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('propagates network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

    await expect(fetchJson('https://example.com')).rejects.toThrow('Network failure');
  });

  it('returns undefined for unexpected content type', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<html></html>'),
      headers: { get: () => 'text/html' },
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('validates data against provided schema', async () => {
    const data = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });
    const schema = z.object({ message: z.string() });

    await expect(fetchJson('https://example.com', undefined, schema)).resolves.toEqual(data);
  });
});
