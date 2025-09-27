jest.mock('fs', () => require('memfs').fs);

import fs from 'fs';
import path from 'path';
import { vol } from 'memfs';
import { listFiles } from '../[shopId]';

describe('listFiles', () => {
  beforeEach(() => {
    vol.reset();
  });

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

  it('throws when encountering an unreadable directory', () => {
    vol.fromJSON({
      '/dir/file.txt': 'ok',
      '/dir/secret/hidden.txt': 'nope',
    });
    const fsMod = require('fs') as typeof import('fs');
    const orig = fsMod.readdirSync;
    fsMod.readdirSync = ((dir: any, opts: any) => {
      if (dir === '/dir/secret') {
        throw new Error('forbidden');
      }
      return (orig as any).call(fsMod, dir, opts);
    }) as any;
    expect(() => listFiles('/dir')).toThrow('forbidden');
    fsMod.readdirSync = orig;
  });
});

