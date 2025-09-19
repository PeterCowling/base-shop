/** @jest-environment node */

import path from 'path';

import {
  fsMock,
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import { getMediaOverview } from '../media.server';

describe('getMediaOverview', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('aggregates media details', async () => {
    fsMock.readdir.mockResolvedValueOnce(['a.jpg', 'b.mp4']);
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({
        'a.jpg': {
          title: 'A',
          type: 'image',
          uploadedAt: '2024-01-02T00:00:00.000Z',
          size: 200,
        },
      }),
    );
    fsMock.stat.mockResolvedValueOnce({
      size: 500,
      mtime: new Date('2024-01-03T00:00:00.000Z'),
    });

    await expect(getMediaOverview('shop')).resolves.toEqual({
      files: [
        {
          url: '/uploads/shop/a.jpg',
          title: 'A',
          altText: undefined,
          tags: undefined,
          type: 'image',
          size: 200,
          uploadedAt: '2024-01-02T00:00:00.000Z',
        },
        {
          url: '/uploads/shop/b.mp4',
          title: undefined,
          altText: undefined,
          tags: undefined,
          type: 'video',
          size: 500,
          uploadedAt: '2024-01-03T00:00:00.000Z',
        },
      ],
      totalBytes: 700,
      imageCount: 1,
      videoCount: 1,
      recentUploads: [
        {
          url: '/uploads/shop/b.mp4',
          title: undefined,
          altText: undefined,
          tags: undefined,
          type: 'video',
          size: 500,
          uploadedAt: '2024-01-03T00:00:00.000Z',
        },
        {
          url: '/uploads/shop/a.jpg',
          title: 'A',
          altText: undefined,
          tags: undefined,
          type: 'image',
          size: 200,
          uploadedAt: '2024-01-02T00:00:00.000Z',
        },
      ],
    });
  });

  it('computes totals and ordering with mixed metadata', async () => {
    fsMock.readdir.mockResolvedValueOnce([
      'first.jpg',
      'second.mp4',
      'third.png',
    ]);
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({
        'first.jpg': {
          title: 'First',
          type: 'image',
          uploadedAt: '2024-04-01T10:00:00.000Z',
          size: 100,
        },
        'second.mp4': {
          title: 'Second',
          type: 'video',
          uploadedAt: 'not-a-date',
          size: 400,
        },
      }),
    );
    fsMock.stat.mockResolvedValueOnce({
      size: 250,
      mtime: new Date('2024-04-03T00:00:00.000Z'),
    });

    await expect(getMediaOverview('shop')).resolves.toEqual({
      files: [
        {
          url: '/uploads/shop/first.jpg',
          title: 'First',
          altText: undefined,
          tags: undefined,
          type: 'image',
          size: 100,
          uploadedAt: '2024-04-01T10:00:00.000Z',
        },
        {
          url: '/uploads/shop/second.mp4',
          title: 'Second',
          altText: undefined,
          tags: undefined,
          type: 'video',
          size: 400,
          uploadedAt: 'not-a-date',
        },
        {
          url: '/uploads/shop/third.png',
          title: undefined,
          altText: undefined,
          tags: undefined,
          type: 'image',
          size: 250,
          uploadedAt: '2024-04-03T00:00:00.000Z',
        },
      ],
      totalBytes: 750,
      imageCount: 2,
      videoCount: 1,
      recentUploads: [
        {
          url: '/uploads/shop/third.png',
          title: undefined,
          altText: undefined,
          tags: undefined,
          type: 'image',
          size: 250,
          uploadedAt: '2024-04-03T00:00:00.000Z',
        },
        {
          url: '/uploads/shop/first.jpg',
          title: 'First',
          altText: undefined,
          tags: undefined,
          type: 'image',
          size: 100,
          uploadedAt: '2024-04-01T10:00:00.000Z',
        },
        {
          url: '/uploads/shop/second.mp4',
          title: 'Second',
          altText: undefined,
          tags: undefined,
          type: 'video',
          size: 400,
          uploadedAt: 'not-a-date',
        },
      ],
    });

    expect(fsMock.stat).toHaveBeenCalledWith(
      path.join(process.cwd(), 'public', 'uploads', 'shop', 'third.png'),
    );
  });

  it('returns empty overview when directory is missing', async () => {
    const error = Object.assign(new Error('missing'), { code: 'ENOENT' });
    fsMock.readdir.mockRejectedValueOnce(error);
    await expect(getMediaOverview('shop')).resolves.toEqual({
      files: [],
      totalBytes: 0,
      imageCount: 0,
      videoCount: 0,
      recentUploads: [],
    });
  });
});

