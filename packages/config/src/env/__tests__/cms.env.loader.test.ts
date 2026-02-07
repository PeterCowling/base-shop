import { describe, expect,it } from '@jest/globals';

const reload = async () => {
  jest.resetModules();
  return await import('../cms.ts');
};

const withEnv = async (
  env: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
) => {
  const prev = { ...process.env };
  Object.entries(env).forEach(([k, v]) => {
    if (v === undefined) delete (process.env as any)[k];
    else (process.env as any)[k] = v;
  });
  try {
    await fn();
  } finally {
    process.env = prev;
  }
};

describe('config/env/cms', () => {
  it('coerces numbers, booleans, and lists', async () =>
    withEnv(
      {
        CMS_PAGINATION_LIMIT: '20',
        CMS_DRAFTS_ENABLED: '1',
        CMS_DRAFTS_DISABLED_PATHS: '/a, /b',
        CMS_SEARCH_ENABLED: 'true',
        CMS_SEARCH_DISABLED_PATHS: '/x,/y',
      },
      async () => {
        const mod = await reload();
        const env = mod.cmsEnv;
        expect(env.CMS_PAGINATION_LIMIT).toBe(20);
        expect(env.CMS_DRAFTS_ENABLED).toBe(true);
        expect(env.CMS_DRAFTS_DISABLED_PATHS).toEqual(['/a', '/b']);
        expect(env.CMS_SEARCH_ENABLED).toBe(true);
        expect(env.CMS_SEARCH_DISABLED_PATHS).toEqual(['/x', '/y']);
      },
    ));

  it('requires CMS_SPACE_URL in production', async () =>
    withEnv(
      {
        NODE_ENV: 'production',
        CMS_ACCESS_TOKEN: 'token',
        SANITY_API_VERSION: 'v1',
        SANITY_PROJECT_ID: 'id',
        SANITY_DATASET: 'dataset',
        SANITY_API_TOKEN: 'tok',
        SANITY_PREVIEW_SECRET: 'secret',
        CMS_SPACE_URL: undefined,
      },
      async () => {
        await expect(reload()).rejects.toThrow(
          'Invalid CMS environment variables',
        );
      },
    ));
});

