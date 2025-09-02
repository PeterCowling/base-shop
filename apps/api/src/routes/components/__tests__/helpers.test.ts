jest.mock('fs', () => require('memfs').fs);

import path from 'path';
import { vol } from 'memfs';
import { extractSummary, gatherChanges, listFiles } from '../[shopId]';

describe('component helpers', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('extractSummary', () => {
    it('returns empty string when changelog has only comments', () => {
      const log = '# heading\n\n  # another comment\n';
      expect(extractSummary(log)).toBe('');
    });
  });

  describe('gatherChanges', () => {
    const root = '/tmp';

    it('handles malformed shop.json gracefully', () => {
      vol.fromJSON({ [`${root}/data/shops/abc/shop.json`]: '{"componentVersions"' });
      expect(gatherChanges('abc', root)).toEqual([]);
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
  });
});
