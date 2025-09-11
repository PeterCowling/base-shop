jest.mock('fs', () => require('memfs').fs);

import fs from 'fs';
import path from 'path';
import { vol } from 'memfs';
import {
  extractSummary,
  gatherChanges,
  listFiles,
  diffDirectories,
} from '../[shopId]';

describe('component helpers', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('extractSummary', () => {
    it('returns empty string when changelog is empty', () => {
      expect(extractSummary('')).toBe('');
    });

    it('returns empty string when changelog has only comments', () => {
      const log = '# heading\n\n  # another comment\n';
      expect(extractSummary(log)).toBe('');
    });

    it('returns first non-comment line', () => {
      const log = '# heading\n\nFirst change\n# another heading';
      expect(extractSummary(log)).toBe('First change');
    });
  });

  describe('gatherChanges', () => {
    const root = '/tmp';

    it('returns empty array when shop.json is missing', () => {
      vol.fromJSON({
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
          version: '1.0.0',
        }),
      });
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('returns empty array when shop.json contains invalid JSON', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: '{ bad json',
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
          version: '1.2.0',
        }),
      });
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('returns empty array when reading shop.json fails', () => {
      const shopPath = path.join(root, 'data', 'shops', 'abc', 'shop.json');
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
        return realRead.call(fs, file, ...args);
      });
      expect(gatherChanges('abc', root)).toEqual([]);
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
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
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
        return realRead.call(fs, file, ...args);
      });
      expect(() => gatherChanges('abc', root)).toThrow('pkg fail');
      spy.mockRestore();
    });

    it('returns empty array when shop.json lacks componentVersions', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({}),
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
          version: '1.2.0',
        }),
      });
      expect(() => gatherChanges('abc', root)).not.toThrow();
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('treats null componentVersions as empty object', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: null,
        }),
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
          version: '1.0.0',
        }),
      });
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('skips stored components without a package.json', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@acme/foo': '1.0.0' },
        }),
      });
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('skips components when versions are unchanged', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@acme/foo': '1.0.0' },
        }),
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
          version: '1.0.0',
        }),
      });
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('skips components when version is undefined', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@acme/foo': '1.0.0' },
        }),
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
        }),
      });
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('returns only components whose versions have changed', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
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
      expect(gatherChanges('abc', root)).toEqual([
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
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@acme/foo': '1.0.0' },
        }),
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
          version: '2.0.0',
        }),
      });
      expect(gatherChanges('abc', root)).toEqual([
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
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@acme/foo': '1.0.0' },
        }),
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          name: '@acme/foo',
          version: '2.0.0',
        }),
        [`${root}/packages/foo/CHANGELOG.md`]: '# heading\n# another comment\n',
      });
      expect(gatherChanges('abc', root)).toEqual([
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
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@acme/foo': null },
        }),
        [`${root}/packages/foo/package.json`]: JSON.stringify({
          version: '1.0.0',
        }),
        [`${root}/packages/foo/CHANGELOG.md`]: 'Initial release',
      });
      expect(gatherChanges('abc', root)).toEqual([
        {
          name: '@acme/foo',
          from: null,
          to: '1.0.0',
          summary: 'Initial release',
          changelog: 'packages/foo/CHANGELOG.md',
        },
      ]);
    });
  });

  describe('listFiles', () => {
    it('recursively collects nested file paths', () => {
      vol.fromJSON({
        '/dir/file1.txt': 'a',
        '/dir/sub/file2.txt': 'b',
        '/dir/sub/deeper/file3.txt': 'c',
      });
      const files = listFiles('/dir').sort();
      expect(files).toEqual([
        'file1.txt',
        path.join('sub', 'file2.txt'),
        path.join('sub', 'deeper', 'file3.txt'),
      ].sort());
    });

    it('records symlink without recursing into target', () => {
      vol.fromJSON({
        '/dir/sub/file.txt': 'a',
      });
      fs.symlinkSync('/dir/sub', '/dir/link');
      const files = listFiles('/dir').sort();
      expect(files).toEqual([
        'link',
        path.join('sub', 'file.txt'),
      ].sort());
    });

    it('returns empty array when directory is empty', () => {
      vol.fromJSON({}, '/empty');
      expect(listFiles('/empty')).toEqual([]);
    });

    it('returns empty array when directory does not exist', () => {
      expect(listFiles('/no-such-dir')).toEqual([]);
    });
  });

  describe('diffDirectories', () => {
    it('returns empty array when directories do not exist', () => {
      expect(diffDirectories('/missing/a', '/missing/b')).toEqual([]);
    });

    it('returns empty array when directories are identical', () => {
      vol.fromJSON({
        '/a/same.txt': 'hello',
        '/a/sub/deep.txt': 'world',
        '/b/same.txt': 'hello',
        '/b/sub/deep.txt': 'world',
      });
      expect(diffDirectories('/a', '/b')).toEqual([]);
    });

    it('detects files present in only one directory', () => {
      vol.fromJSON({ '/a/only.txt': 'hello' });
      expect(diffDirectories('/a', '/b')).toEqual(['only.txt']);
    });

    it('detects files present only in second directory', () => {
      vol.fromJSON({ '/b/only.txt': 'hello' });
      expect(diffDirectories('/a', '/b')).toEqual(['only.txt']);
    });

    it('detects nested files present only in first directory', () => {
      vol.fromJSON({ '/a/subdir/file.txt': 'hello' });
      expect(diffDirectories('/a', '/b')).toEqual([
        path.join('subdir', 'file.txt'),
      ]);
    });

    it('detects when file contents differ', () => {
      vol.fromJSON({
        '/a/same.txt': 'one',
        '/b/same.txt': 'two',
      });
      expect(diffDirectories('/a', '/b')).toEqual(['same.txt']);
    });
  });
});
