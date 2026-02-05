import { vol } from 'memfs';
import path from 'path';

import { listFiles } from '../../../src/routes/components/[shopId]';

jest.mock('fs', () => require('memfs').fs);

describe('listFiles', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns all nested files for a multi-level directory', () => {
    vol.fromJSON({
      '/root/a.txt': 'A',
      '/root/dir1/b.txt': 'B',
      '/root/dir1/dir2/c.txt': 'C',
    });

    const files = listFiles('/root');
    expect(files.sort()).toEqual(
      [
        'a.txt',
        path.join('dir1', 'b.txt'),
        path.join('dir1', 'dir2', 'c.txt'),
      ].sort(),
    );
  });

  it('returns an empty array when the directory does not exist', () => {
    const files = listFiles('/missing');
    expect(files).toEqual([]);
  });
});
