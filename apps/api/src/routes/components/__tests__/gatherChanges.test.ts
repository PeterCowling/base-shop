jest.mock('fs', () => require('memfs').fs);

import fs from 'fs';
import path from 'path';
import { vol } from 'memfs';
import { gatherChanges } from '../[shopId]';

describe('gatherChanges', () => {
  const root = '/tmp';

  beforeEach(() => {
    vol.reset();
  });

  it('returns empty array when shop.json is missing', () => {
    vol.fromJSON({
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '1.0.0',
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([]);
  });

  it('returns empty array when shop.json contains invalid JSON', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: '{ bad json',
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '1.2.0',
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([]);
  });

  it('returns empty array when reading shop.json fails', () => {
    const shopPath = path.join(root, 'data', 'shops', 'bcd', 'shop.json');
    vol.fromJSON({
      [shopPath]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
    });
    const realRead = fs.readFileSync;
    const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...args) => {
      if (file === shopPath) {
        throw new Error('boom');
      }
      return (realRead as any).call(fs, file, ...args);
    });
    expect(gatherChanges('bcd', root)).toEqual([]);
    spy.mockRestore();
  });

  it('throws error when package.json contains invalid JSON', () => {
    vol.fromJSON({
      [`${root}/data/shops/shop/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
      [`${root}/packages/foo/package.json`]: '{ bad json',
    });
    expect(() => gatherChanges('shop', root)).toThrow(SyntaxError);
  });

  it('propagates errors when reading package.json fails', () => {
    const pkgPath = path.join(root, 'packages', 'foo', 'package.json');
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
      [pkgPath]: JSON.stringify({
        name: '@acme/foo',
        version: '2.0.0',
      }),
    });
    const realRead = fs.readFileSync;
    const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...args) => {
      if (file === pkgPath) {
        throw new Error('pkg fail');
      }
      return (realRead as any).call(fs, file, ...args);
    });
    expect(() => gatherChanges('bcd', root)).toThrow('pkg fail');
    spy.mockRestore();
  });

  it('returns empty array when shop.json lacks componentVersions', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({}),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '1.2.0',
      }),
    });
    expect(() => gatherChanges('bcd', root)).not.toThrow();
    expect(gatherChanges('bcd', root)).toEqual([]);
  });

  it('treats null componentVersions as empty object', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: null,
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '1.0.0',
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([]);
  });

  it('skips stored components without a package.json', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([]);
  });

  it('skips components when versions are unchanged', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '1.0.0',
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([]);
  });

  it('skips components when version is undefined', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([]);
  });

  it('returns only components whose versions have changed', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: {
          '@acme/foo': '1.0.0',
          '@acme/bar': '1.0.0',
        },
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '1.0.0',
      }),
      [`${root}/packages/bar/package.json`]: JSON.stringify({
        name: '@acme/bar',
        version: '2.0.0',
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([
      {
        name: '@acme/bar',
        from: '1.0.0',
        to: '2.0.0',
        summary: '',
        changelog: '',
      },
    ]);
  });

  it('handles missing changelog files', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '2.0.0',
      }),
    });
    expect(gatherChanges('bcd', root)).toEqual([
      {
        name: '@acme/foo',
        from: '1.0.0',
        to: '2.0.0',
        summary: '',
        changelog: '',
      },
    ]);
  });

  it('handles changelog with only comments', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '2.0.0',
      }),
      [`${root}/packages/foo/CHANGELOG.md`]: '# heading\n# another comment\n',
    });
    expect(gatherChanges('bcd', root)).toEqual([
      {
        name: '@acme/foo',
        from: '1.0.0',
        to: '2.0.0',
        summary: '',
        changelog: 'packages/foo/CHANGELOG.md',
      },
    ]);
  });

  it('falls back to stored key and null when pkg.name and old version are missing', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': null },
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        version: '1.0.0',
      }),
      [`${root}/packages/foo/CHANGELOG.md`]: 'Initial release',
    });
    expect(gatherChanges('bcd', root)).toEqual([
      {
        name: '@acme/foo',
        from: null,
        to: '1.0.0',
        summary: 'Initial release',
        changelog: 'packages/foo/CHANGELOG.md',
      },
    ]);
  });

  it('surfaces errors from unreadable package directories', () => {
    vol.fromJSON({
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/foo': '1.0.0' },
      }),
      [`${root}/packages/foo/package.json`]: JSON.stringify({
        name: '@acme/foo',
        version: '2.0.0',
      }),
    });
    const fsMod = require('fs') as typeof import('fs');
    const origReaddir = fsMod.readdirSync;
    const origReadFile = fsMod.readFileSync;
    fsMod.readdirSync = ((dir: any, opts: any) => {
      if (dir === path.join(root, 'packages', 'foo')) {
        throw new Error('unreadable');
      }
      return (origReaddir as any).call(fsMod, dir, opts);
    }) as any;
    fsMod.readFileSync = ((file: any, ...args: any[]) => {
      fsMod.readdirSync(path.dirname(file));
      return (origReadFile as any).call(fsMod, file, ...args);
    }) as any;
    expect(() => gatherChanges('bcd', root)).toThrow('unreadable');
    fsMod.readdirSync = origReaddir;
    fsMod.readFileSync = origReadFile;
  });
});

