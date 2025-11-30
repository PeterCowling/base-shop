jest.mock('fs', () => require('memfs').fs);

import path from 'path';
import { vol } from 'memfs';
import {
  extractSummary,
  gatherChanges,
  diffDirectories,
} from '../../../src/routes/components/[shopId]';

describe('helpers', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('extractSummary', () => {
    it('returns empty string when changelog has only comments and blank lines', () => {
      const log = '# heading\n\n# another comment\n\n';
      expect(extractSummary(log)).toBe('');
    });
    it('returns first non-comment line', () => {
      const log = '# heading\n\nFirst line\nSecond line';
      expect(extractSummary(log)).toBe('First line');
    });
  });

  describe('gatherChanges', () => {
    const root = '/root';

    it('handles missing shop.json', () => {
      expect(gatherChanges('bcd', root)).toEqual([]);
    });

    it('handles invalid shop.json', () => {
      vol.fromJSON({ [`${root}/data/shops/cover-me-pretty/shop.json`]: '{oops}' });
      expect(gatherChanges('bcd', root)).toEqual([]);
    });

    it("skips components with unchanged versions", () => {
      vol.fromJSON({
        [`${root}/data/shops/cover-me-pretty/shop.json`]: JSON.stringify({
          componentVersions: { '@scope/pkg': '1.0.0' },
        }),
        [`${root}/packages/pkg/package.json`]: JSON.stringify({
          name: '@scope/pkg',
          version: '1.0.0',
        }),
      });

      expect(gatherChanges('bcd', root)).toEqual([]);
    });

    it('handles version bumps and changelog summaries', () => {
      vol.fromJSON({
        [`${root}/data/shops/cover-me-pretty/shop.json`]: JSON.stringify({
          componentVersions: { '@scope/pkg': '1.0.0' },
        }),
        [`${root}/packages/pkg/package.json`]: JSON.stringify({
          name: '@scope/pkg',
          version: '1.1.0',
        }),
        [`${root}/packages/pkg/CHANGELOG.md`]: '# Changelog\n\nAdded feature\nMore',
      });

      const changes = gatherChanges('bcd', root);
      expect(changes).toEqual([
        {
          name: '@scope/pkg',
          from: '1.0.0',
          to: '1.1.0',
          summary: 'Added feature',
          changelog: path.join('packages', 'pkg', 'CHANGELOG.md'),
        },
      ]);
    });

    it('handles packages without CHANGELOG', () => {
      vol.fromJSON({
        [`${root}/data/shops/cover-me-pretty/shop.json`]: JSON.stringify({
          componentVersions: { '@scope/pkg': '1.0.0' },
        }),
        [`${root}/packages/pkg/package.json`]: JSON.stringify({
          name: '@scope/pkg',
          version: '1.1.0',
        }),
      });

      expect(gatherChanges('bcd', root)).toEqual([
        {
          name: '@scope/pkg',
          from: '1.0.0',
          to: '1.1.0',
          summary: '',
          changelog: '',
        },
      ]);
    });
  });

  describe('diffDirectories', () => {
    it('returns empty diff for identical directories', () => {
      vol.fromJSON({
        '/a/same.txt': 'content',
        '/b/same.txt': 'content',
        '/a/nested/file.txt': 'hello',
        '/b/nested/file.txt': 'hello',
      });

      expect(diffDirectories('/a', '/b')).toEqual([]);
    });

    it('lists files when one directory is missing', () => {
      vol.fromJSON({
        '/a/only.txt': 'one',
        '/a/nested/file.txt': 'two',
      });

      const diff = diffDirectories('/a', '/b');
      expect(diff.sort()).toEqual(
        ['only.txt', path.join('nested', 'file.txt')].sort(),
      );
    });

    it('detects added, removed, and modified files', () => {
      vol.fromJSON({
        '/a/only-a.txt': 'A',
        '/a/common.txt': 'same',
        '/a/changed.txt': 'old',
        '/b/only-b.txt': 'B',
        '/b/common.txt': 'same',
        '/b/changed.txt': 'new',
      });

      const diff = diffDirectories('/a', '/b');
      expect(diff.sort()).toEqual(
        ['only-a.txt', 'only-b.txt', 'changed.txt'].sort(),
      );
    });
  });
});
