/** @jest-environment node */

import { File } from 'node:buffer';

import {
  ensureHasPermission,
  getMediaOverviewForShop,
  listMediaFiles,
  resetMediaMocks,
  restoreMediaMocks,
  uploadMediaFile,
} from './media.test.mocks';
import { listMedia, uploadMedia, getMediaOverview } from '../media.server';

describe('media.server wrappers', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('listMedia enforces auth and handles missing directories', async () => {
    listMediaFiles.mockRejectedValueOnce(Object.assign(new Error('missing'), { code: 'ENOENT' }));

    await expect(listMedia('shop')).resolves.toEqual([]);
    expect(ensureHasPermission).toHaveBeenCalledWith('manage_media');
    expect(listMediaFiles).toHaveBeenCalledWith('shop');
  });

  it('uploadMedia parses form data and delegates to service', async () => {
    const result = { url: '/uploads/shop/file.jpg' };
    uploadMediaFile.mockResolvedValueOnce(result);

    const formData = new FormData();
    formData.append('file', new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
    formData.append('tags', '["hero"]');

    await expect(uploadMedia('shop', formData)).resolves.toBe(result);
    expect(ensureHasPermission).toHaveBeenCalledWith('manage_media');
    expect(uploadMediaFile).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: 'shop',
        tags: ['hero'],
      }),
    );
  });

  it('getMediaOverview logs failures from the service layer', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getMediaOverviewForShop.mockRejectedValueOnce(new Error('boom'));

    await expect(getMediaOverview('shop')).rejects.toThrow('Failed to load media overview');
    expect(consoleSpy).toHaveBeenCalled();
    expect(ensureHasPermission).toHaveBeenCalledWith('manage_media');
    expect(getMediaOverviewForShop).toHaveBeenCalledWith('shop');
    consoleSpy.mockRestore();
  });
});
