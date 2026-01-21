/** @jest-environment node */
import { mkdtemp, rm,writeFile } from 'node:fs/promises';
import path from 'node:path';

import { importFresh,withEnv } from './envTestUtils';

describe('withEnv', () => {
  const KEY = 'TEST_ENV_VAR';

  afterEach(() => {
    delete process.env[KEY];
  });

  it('temporarily removes environment variables when set to undefined', async () => {
    process.env[KEY] = 'original';

    await withEnv({ [KEY]: undefined }, async () => {
      expect(process.env[KEY]).toBeUndefined();
    });

    expect(process.env[KEY]).toBe('original');
  });

  it('sets and restores environment variables', async () => {
    process.env[KEY] = 'original';

    await withEnv({ [KEY]: 'temp' }, async () => {
      expect(process.env[KEY]).toBe('temp');
    });

    expect(process.env[KEY]).toBe('original');
  });

  it('isolates unspecified environment variables', async () => {
    process.env[KEY] = 'original';

    await withEnv({}, async () => {
      expect(process.env[KEY]).toBeUndefined();
    });

    expect(process.env[KEY]).toBe('original');
  });

  it('restores environment variables after errors', async () => {
    process.env[KEY] = 'original';
    const error = new Error('boom');

    await expect(
      withEnv({ [KEY]: 'temp' }, async () => {
        expect(process.env[KEY]).toBe('temp');
        throw error;
      }),
    ).rejects.toBe(error);

    expect(process.env[KEY]).toBe('original');
  });
});

describe('importFresh', () => {
  it('imports a module freshly', async () => {
    const mod = await importFresh<typeof import('./envTestUtils')>(
      './envTestUtils',
    );
    expect(mod).toHaveProperty('withEnv');
  });

  it('rejects when module cannot be imported', async () => {
    await expect(importFresh('./does-not-exist')).rejects.toThrow();
  });

  it('resets module state between imports', async () => {
    const dir = await mkdtemp(path.join(__dirname, 'importFresh-'));
    const file = path.join(dir, 'counter.cjs');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- writes to temp file path during test setup (ENG-1234)
    await writeFile(
      file,
      'let counter = 0; module.exports.getCount = () => { counter += 1; return counter; };',
    );
    const rel = `./${path.basename(dir)}/counter.cjs`;
    try {
      const first = await importFresh<{ default: { getCount: () => number } }>(rel);
      expect(first.default.getCount()).toBe(1);
      jest.resetModules();
      const second = await importFresh<{ default: { getCount: () => number } }>(rel);
      expect(second.default.getCount()).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
