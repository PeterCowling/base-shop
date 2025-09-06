jest.mock('fs', () => require('memfs').fs);

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

    it('returns empty array when directory does not exist', () => {
      expect(listFiles('/no-such-dir')).toEqual([]);
    });
  });

  describe('diffDirectories', () => {
    it('detects files present in only one directory', () => {
      vol.fromJSON({ '/a/only.txt': 'hello' });
      expect(diffDirectories('/a', '/b')).toEqual(['only.txt']);
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
