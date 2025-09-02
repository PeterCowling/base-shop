import { fetchJson } from './fetchJson';
import { z } from 'zod';

describe('fetchJson', () => {
  beforeEach(() => {
    // @ts-expect-error - jest mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('parses JSON when request succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ msg: 'hi' })),
    });
    const schema = z.object({ msg: z.string() });
    await expect(
      fetchJson('https://example.com', undefined, schema),
    ).resolves.toEqual({ msg: 'hi' });
  });

  it('throws with error message on HTTP failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'boom' })),
    });
    await expect(fetchJson('https://example.com')).rejects.toThrow('boom');
  });

  it('returns undefined when response is not JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('not-json'),
    });
    await expect(fetchJson('https://example.com')).resolves.toBeUndefined();
  });
});

