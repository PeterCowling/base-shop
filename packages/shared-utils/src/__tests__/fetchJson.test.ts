import { fetchJson } from '../fetchJson';
import { z } from 'zod';

describe('fetchJson', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches JSON and parses with schema', async () => {
    const data = { message: 'ok' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });

    const schema = z.object({ message: z.string() });
    await expect(fetchJson('https://example.com', undefined, schema)).resolves.toEqual(data);
  });

  it('throws status text for non-JSON error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      status: 500,
      text: jest.fn().mockResolvedValue('not json'),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('Internal Server Error');
  });

  it('throws custom error message from payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      status: 400,
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Custom message' })),
    });

    await expect(fetchJson('https://example.com')).rejects.toThrow('Custom message');
  });
});
