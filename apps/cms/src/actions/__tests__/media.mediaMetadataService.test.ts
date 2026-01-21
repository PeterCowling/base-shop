/** @jest-environment node */

import path from 'path';

import {
  getMediaOverviewForShop,
  updateMediaMetadataEntry,
} from '../media/mediaMetadataService';

import {
  fsMock,
  resetMediaMocks,
  restoreMediaMocks,
  writeJsonFileMock,
} from './media.test.mocks';

describe('mediaMetadataService', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  describe('updateMediaMetadataEntry', () => {
    it('updates metadata fields and normalizes tags', async () => {
      fsMock.readFile.mockResolvedValueOnce(
        JSON.stringify({
          'file.jpg': {
            title: 'Old',
            altText: 'Old alt',
            type: 'image',
            size: 111,
            uploadedAt: '2024-02-01T00:00:00.000Z',
          },
        }),
      );
      fsMock.stat.mockResolvedValueOnce({
        size: 222,
        mtime: new Date('2024-02-01T00:00:00.000Z'),
      });

      await expect(
        updateMediaMetadataEntry({
          shop: 'shop',
          fileUrl: '/uploads/shop/file.jpg',
          fields: {
            title: 'New',
            altText: null,
            tags: [' fresh ', 'fresh'],
          },
        }),
      ).resolves.toEqual({
        url: '/uploads/shop/file.jpg',
        title: 'New',
        altText: undefined,
        tags: ['fresh'],
        type: 'image',
        size: 111,
        uploadedAt: '2024-02-01T00:00:00.000Z',
      });

      expect(writeJsonFileMock).toHaveBeenCalledWith(
        path.join(
          process.cwd(),
          'public',
          'uploads',
          'shop',
          'metadata.json',
        ),
        {
          'file.jpg': expect.objectContaining({
            title: 'New',
            tags: ['fresh'],
            type: 'image',
          }),
        },
      );
    });
  });

  describe('getMediaOverviewForShop', () => {
    it('returns aggregated overview data', async () => {
      fsMock.readdir.mockResolvedValueOnce(['one.jpg']);
      fsMock.readFile.mockResolvedValueOnce(
        JSON.stringify({
          'one.jpg': {
            type: 'image',
            uploadedAt: '2024-07-01T00:00:00.000Z',
            size: 150,
          },
        }),
      );

      await expect(getMediaOverviewForShop('shop')).resolves.toEqual({
        files: [
          {
            url: '/uploads/shop/one.jpg',
            title: undefined,
            altText: undefined,
            tags: undefined,
            type: 'image',
            size: 150,
            uploadedAt: '2024-07-01T00:00:00.000Z',
          },
        ],
        totalBytes: 150,
        imageCount: 1,
        videoCount: 0,
        recentUploads: [
          {
            url: '/uploads/shop/one.jpg',
            title: undefined,
            altText: undefined,
            tags: undefined,
            type: 'image',
            size: 150,
            uploadedAt: '2024-07-01T00:00:00.000Z',
          },
        ],
      });
    });

    it('returns empty overview when directory is missing', async () => {
      const error = Object.assign(new Error('missing'), { code: 'ENOENT' });
      fsMock.readdir.mockRejectedValueOnce(error);
      await expect(getMediaOverviewForShop('shop')).resolves.toEqual({
        files: [],
        totalBytes: 0,
        imageCount: 0,
        videoCount: 0,
        recentUploads: [],
      });
    });
  });
});

