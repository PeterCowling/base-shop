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

  it('returns parsed JSON when the response succeeds', async () => {
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

  it('rejects when the server responds with an error status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'boom' })),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('boom');
  });

  it('throws a parsing error for invalid JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('invalid'),
    });

    const schema = z.object({ message: z.string() });
    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).rejects.toThrow(z.ZodError);
  });
});

