/** @jest-environment node */
import { withEnv, importFresh } from './envTestUtils';

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
});
