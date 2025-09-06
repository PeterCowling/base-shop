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
    it('returns first non-comment line', () => {
      const log = '# heading\n\nFirst line\nSecond line';
      expect(extractSummary(log)).toBe('First line');
    });
  });

  describe('gatherChanges', () => {
    const root = '/root';

    it('handles missing shop.json', () => {
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('handles invalid shop.json', () => {
      vol.fromJSON({ [`${root}/data/shops/abc/shop.json`]: '{oops}' });
      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it("skips components with unchanged versions", () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@scope/pkg': '1.0.0' },
        }),
        [`${root}/packages/pkg/package.json`]: JSON.stringify({
          name: '@scope/pkg',
          version: '1.0.0',
        }),
      });

      expect(gatherChanges('abc', root)).toEqual([]);
    });

    it('handles version bumps and changelog summaries', () => {
      vol.fromJSON({
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@scope/pkg': '1.0.0' },
        }),
        [`${root}/packages/pkg/package.json`]: JSON.stringify({
          name: '@scope/pkg',
          version: '1.1.0',
        }),
        [`${root}/packages/pkg/CHANGELOG.md`]: '# Changelog\n\nAdded feature\nMore',
      });

      const changes = gatherChanges('abc', root);
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
        [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
          componentVersions: { '@scope/pkg': '1.0.0' },
        }),
        [`${root}/packages/pkg/package.json`]: JSON.stringify({
          name: '@scope/pkg',
          version: '1.1.0',
        }),
      });

      expect(gatherChanges('abc', root)).toEqual([
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

