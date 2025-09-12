import path from 'path';
import { verify, setup, createWarnSpy, createContext, vol } from './testHelpers';
import * as route from '../[shopId]';

const { onRequest } = route;

describe('onRequest file operations', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    setup();
    warnSpy = createWarnSpy();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns components without config diff when diff not requested', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const root = path.resolve(__dirname, '../../../../../../..');
    vol.fromJSON({
      [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/button': '1.0.0' },
      }),
      [`${root}/packages/button/package.json`]: JSON.stringify({
        name: '@acme/button',
        version: '1.1.0',
      }),
      [`${root}/packages/button/CHANGELOG.md`]: '# Changelog\n\nFixed bug\n',
    });

    const res = await onRequest(
      createContext({ shopId: 'abc', authorization: 'Bearer good' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        {
          name: '@acme/button',
          from: '1.0.0',
          to: '1.1.0',
          summary: 'Fixed bug',
          changelog: 'packages/button/CHANGELOG.md',
        },
      ],
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('omits config diff when diff query param absent', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const root = path.resolve(__dirname, '../../../../../../..');
    vol.fromJSON({
      [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/button': '1.0.0' },
      }),
      [`${root}/packages/button/package.json`]: JSON.stringify({
        name: '@acme/button',
        version: '1.1.0',
      }),
      [`${root}/packages/button/CHANGELOG.md`]: '# Changelog\n\nFixed bug\n',
      [`${root}/apps/shop-abc/src/templates/main.html`]: 'app',
      [`${root}/packages/template-app/src/templates/main.html`]: 'template',
      [`${root}/apps/shop-abc/src/translations/en.json`]: '{}',
      [`${root}/packages/template-app/src/translations/en.json`]: '{"foo":"bar"}',
    });

    const res = await onRequest(
      createContext({ shopId: 'abc', authorization: 'Bearer good' }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      components: [
        {
          name: '@acme/button',
          from: '1.0.0',
          to: '1.1.0',
          summary: 'Fixed bug',
          changelog: 'packages/button/CHANGELOG.md',
        },
      ],
    });
    expect(json).not.toHaveProperty('configDiff');
  });

  it('returns components and config diff when diff requested', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const root = path.resolve(__dirname, '../../../../../../..');
    vol.fromJSON({
      [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/button': '1.0.0' },
      }),
      [`${root}/packages/button/package.json`]: JSON.stringify({
        name: '@acme/button',
        version: '1.1.0',
      }),
      [`${root}/packages/button/CHANGELOG.md`]: '# Changelog\n\nFixed bug\n',
      [`${root}/apps/shop-abc/src/templates/main.html`]: 'app',
      [`${root}/packages/template-app/src/templates/main.html`]: 'template',
      [`${root}/apps/shop-abc/src/translations/en.json`]: '{}',
      [`${root}/packages/template-app/src/translations/en.json`]: '{"foo":"bar"}',
    });

    const res = await onRequest(
      createContext({ shopId: 'abc', authorization: 'Bearer good', url: 'http://localhost?diff=1' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        {
          name: '@acme/button',
          from: '1.0.0',
          to: '1.1.0',
          summary: 'Fixed bug',
          changelog: 'packages/button/CHANGELOG.md',
        },
      ],
      configDiff: { templates: ['main.html'], translations: ['en.json'] },
    });
  });

  it('returns config diff for files present in only one directory', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const root = path.resolve(__dirname, '../../../../../../..');
    vol.fromJSON({
      [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/button': '1.0.0' },
      }),
      [`${root}/packages/button/package.json`]: JSON.stringify({
        name: '@acme/button',
        version: '1.1.0',
      }),
      [`${root}/packages/button/CHANGELOG.md`]: '# Changelog\\n\\nFixed bug\\n',
      [`${root}/apps/shop-abc/src/templates/app-only.html`]: 'app',
      [`${root}/apps/shop-abc/src/templates/shared.html`]: 'same',
      [`${root}/packages/template-app/src/templates/template-only.html`]: 'tpl',
      [`${root}/packages/template-app/src/templates/shared.html`]: 'same',
      [`${root}/apps/shop-abc/src/translations/app-only.json`]: '{}',
      [`${root}/apps/shop-abc/src/translations/common.json`]: '{}',
      [`${root}/packages/template-app/src/translations/template-only.json`]: '{}',
      [`${root}/packages/template-app/src/translations/common.json`]: '{}',
    });

    const res = await onRequest(
      createContext({ shopId: 'abc', authorization: 'Bearer good', url: 'http://localhost?diff=1' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        {
          name: '@acme/button',
          from: '1.0.0',
          to: '1.1.0',
          summary: '',
          changelog: 'packages/button/CHANGELOG.md',
        },
      ],
      configDiff: {
        templates: ['app-only.html', 'template-only.html'],
        translations: ['app-only.json', 'template-only.json'],
      },
    });
  });

  it('returns empty components and config diff when config directories match', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const root = path.resolve(__dirname, '../../../../../../..');
    vol.fromJSON({
      [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/button': '1.1.0' },
      }),
      [`${root}/packages/button/package.json`]: JSON.stringify({
        name: '@acme/button',
        version: '1.1.0',
      }),
      [`${root}/packages/button/CHANGELOG.md`]: '# Changelog\\n\\nNothing changed\\n',
      [`${root}/apps/shop-abc/src/templates/main.html`]: 'same',
      [`${root}/packages/template-app/src/templates/main.html`]: 'same',
      [`${root}/apps/shop-abc/src/translations/en.json`]: '{"foo":"bar"}',
      [`${root}/packages/template-app/src/translations/en.json`]: '{"foo":"bar"}',
    });

    const res = await onRequest(
      createContext({ shopId: 'abc', authorization: 'Bearer good', url: 'http://localhost?diff=1' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [],
      configDiff: { templates: [], translations: [] },
    });
  });

  it('returns empty config diff when diff requested but config directories missing', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const root = path.resolve(__dirname, '../../../../../../..');
    vol.fromJSON({
      [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/button': '1.0.0' },
      }),
      [`${root}/packages/button/package.json`]: JSON.stringify({
        name: '@acme/button',
        version: '1.1.0',
      }),
      [`${root}/packages/button/CHANGELOG.md`]: '# Changelog\n\nFixed bug\n',
    });

    const res = await onRequest(
      createContext({ shopId: 'abc', authorization: 'Bearer good', url: 'http://localhost?diff=1' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        {
          name: '@acme/button',
          from: '1.0.0',
          to: '1.1.0',
          summary: 'Fixed bug',
          changelog: 'packages/button/CHANGELOG.md',
        },
      ],
      configDiff: { templates: [], translations: [] },
    });
  });
});
