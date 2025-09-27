jest.mock('fs', () => require('memfs').fs);

import path from 'path';
import { vol } from 'memfs';
import { diffDirectories } from '../[shopId]';

describe('diffDirectories', () => {
  beforeEach(() => {
    vol.reset();
  });

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

