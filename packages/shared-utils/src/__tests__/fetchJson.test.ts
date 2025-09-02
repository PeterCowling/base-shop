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

  it('returns undefined for non-JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('not json'),
    });

    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
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
});

