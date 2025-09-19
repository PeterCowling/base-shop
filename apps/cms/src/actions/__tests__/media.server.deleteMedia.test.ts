/** @jest-environment node */

import path from 'path';

import {
  fsMock,
  writeJsonFileMock,
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import * as mediaHelpers from '../media.helpers';
import { deleteMedia } from '../media.server';

describe('deleteMedia', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('rejects paths outside uploads directory', async () => {
    await expect(deleteMedia('shop', '/uploads/other/file.jpg')).rejects.toThrow(
      'Invalid file path',
    );
    await expect(deleteMedia('shop', '/etc/passwd')).rejects.toThrow(
      'Invalid file path',
    );
    await expect(deleteMedia('shop', '/uploads/shop/../escape.jpg')).rejects.toThrow(
      'Invalid file path',
    );
  });

  it('deletes file and updates metadata', async () => {
    fsMock.readFile.mockResolvedValueOnce('{"file.jpg":{"title":"t"}}');
    await deleteMedia('shop', '/uploads/shop/file.jpg');
    expect(fsMock.unlink).toHaveBeenCalledWith(
      path.join(process.cwd(), 'public', 'uploads', 'shop', 'file.jpg'),
    );
    expect(writeJsonFileMock).toHaveBeenCalledWith(
      path.join(
        process.cwd(),
        'public',
        'uploads',
        'shop',
        'metadata.json',
      ),
      {},
    );
  });

  it('ignores missing files and does not update metadata', async () => {
    fsMock.unlink.mockRejectedValueOnce(new Error('missing'));
    jest.spyOn(mediaHelpers, 'readMetadata').mockResolvedValue({});
    const writeMetadataSpy = jest.spyOn(mediaHelpers, 'writeMetadata');
    await expect(deleteMedia('shop', '/uploads/shop/missing.jpg')).resolves.toBeUndefined();
    expect(writeMetadataSpy).not.toHaveBeenCalled();
  });
});

