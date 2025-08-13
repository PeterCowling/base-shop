import { fetchJson } from '../src/fetchJson';
import { z } from 'zod';

describe('fetchJson', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns parsed data on success', async () => {
    const responseData = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
    });

    await expect(fetchJson<typeof responseData>('https://example.com'))
      .resolves.toEqual(responseData);
  });

  it('returns undefined when response body is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('returns undefined when response body contains invalid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('not json'),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });

  it('throws error message from JSON error payload', async () => {
    const errorPayload = { error: 'Bad Request' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      status: 400,
      text: jest.fn().mockResolvedValue(JSON.stringify(errorPayload)),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Bad Request',
    );
  });

  it('throws status text when response body is not JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      status: 500,
      text: jest.fn().mockResolvedValue('not json'),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Internal Server Error',
    );
  });

  it('propagates network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

    await expect(fetchJson('https://example.com')).rejects.toThrow(
      'Network failure',
    );
  });

  it('validates data against provided schema', async () => {
    const responseData = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
    });

    const schema = z.object({ message: z.string() }).strict();

    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).resolves.toEqual(responseData);
  });

  it('throws validation error when schema parsing fails', async () => {
    const responseData = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
    });

    const schema = z.object({ count: z.number() }).strict();

    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});
