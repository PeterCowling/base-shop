/** @jest-environment node */

import { File } from 'node:buffer';

import {
  ensureAuthorized,
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import * as mediaFileService from '../media/mediaFileService';
import * as mediaMetadataService from '../media/mediaMetadataService';
import { listMedia, uploadMedia, getMediaOverview } from '../media.server';

describe('media.server wrappers', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('listMedia enforces auth and handles missing directories', async () => {
    const serviceSpy = jest
      .spyOn(mediaFileService, 'listMediaFiles')
      .mockRejectedValueOnce(Object.assign(new Error('missing'), { code: 'ENOENT' }));

    await expect(listMedia('shop')).resolves.toEqual([]);
    expect(ensureAuthorized).toHaveBeenCalled();
    expect(serviceSpy).toHaveBeenCalledWith('shop');
    serviceSpy.mockRestore();
  });

  it('uploadMedia parses form data and delegates to service', async () => {
    const result = { url: '/uploads/shop/file.jpg' };
    const serviceSpy = jest
      .spyOn(mediaFileService, 'uploadMediaFile')
      .mockResolvedValueOnce(result);

    const formData = new FormData();
    formData.append('file', new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
    formData.append('tags', '["hero"]');

    await expect(uploadMedia('shop', formData)).resolves.toBe(result);
    expect(serviceSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: 'shop',
        tags: ['hero'],
      }),
    );
    serviceSpy.mockRestore();
  });

  it('getMediaOverview logs failures from the service layer', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const serviceSpy = jest
      .spyOn(mediaMetadataService, 'getMediaOverviewForShop')
      .mockRejectedValueOnce(new Error('boom'));

    await expect(getMediaOverview('shop')).rejects.toThrow('Failed to load media overview');
    expect(consoleSpy).toHaveBeenCalled();
    expect(serviceSpy).toHaveBeenCalledWith('shop');
    consoleSpy.mockRestore();
    serviceSpy.mockRestore();
  });
});

