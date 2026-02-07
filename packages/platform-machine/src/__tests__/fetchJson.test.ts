import { z } from 'zod';

import { fetchJson } from '@acme/lib/http';

describe('fetchJson', () => {
  beforeEach(() => {
    // @ts-expect-error mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns parsed and validated data on 200', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ ok: true })),
    });
    const schema = z.object({ ok: z.boolean() });
    await expect(fetchJson('http://test', undefined, schema)).resolves.toEqual({ ok: true });
  });

  it('returns undefined on 200 with empty body and no schema', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    });
    await expect(fetchJson('http://test')).resolves.toBeUndefined();
  });

  it('throws error message from body when response not ok with JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Bad',
      text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Boom' })),
    });
    await expect(fetchJson('http://test')).rejects.toThrow('Boom');
  });

  it('throws statusText when body is invalid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Teapot',
      text: jest.fn().mockResolvedValue('nope'),
    });
    await expect(fetchJson('http://test')).rejects.toThrow('Teapot');
  });
});

