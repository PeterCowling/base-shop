/** @jest-environment node */

import path from 'path';

import {
  fsMock,
  writeJsonFileMock,
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import { updateMediaMetadata } from '../media.server';
import type { UpdateMediaMetadataFields } from '../media.server';

describe('updateMediaMetadata', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('updates metadata fields and returns updated item', async () => {
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({
        'file.jpg': {
          title: 'Old',
          altText: 'Old alt',
          type: 'image',
          tags: ['legacy'],
          uploadedAt: '2024-01-01T00:00:00.000Z',
          size: 400,
        },
      }),
    );
    fsMock.stat.mockResolvedValueOnce({
      size: 400,
      mtime: new Date('2024-01-01T00:00:00.000Z'),
    });

    await expect(
      updateMediaMetadata('shop', '/uploads/shop/file.jpg', {
        title: 'New title',
        altText: null,
        tags: ['fresh', ' hero'],
      }),
    ).resolves.toEqual({
      url: '/uploads/shop/file.jpg',
      title: 'New title',
      altText: undefined,
      tags: ['fresh', 'hero'],
      type: 'image',
      size: 400,
      uploadedAt: '2024-01-01T00:00:00.000Z',
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
        'file.jpg': {
          title: 'New title',
          type: 'image',
          tags: ['fresh', 'hero'],
          size: 400,
          uploadedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    );
  });

  it('clears metadata fields when null values are provided', async () => {
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({
        'file.jpg': {
          title: 'Old title',
          altText: 'Existing alt',
          tags: ['legacy'],
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
      updateMediaMetadata('shop', '/uploads/shop/file.jpg', {
        title: null,
        altText: null,
        tags: null,
      }),
    ).resolves.toEqual({
      url: '/uploads/shop/file.jpg',
      title: undefined,
      altText: undefined,
      tags: [],
      type: 'image',
      size: 111,
      uploadedAt: '2024-02-01T00:00:00.000Z',
    });

    const [, metadata] = writeJsonFileMock.mock.calls[0];
    expect(metadata['file.jpg']).toEqual({
      type: 'image',
      tags: [],
      size: 111,
      uploadedAt: '2024-02-01T00:00:00.000Z',
    });
  });

  it('removes tags when normalization produces no valid values', async () => {
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({
        'file.jpg': {
          tags: ['keep'],
          type: 'image',
          size: 99,
          uploadedAt: '2024-03-01T00:00:00.000Z',
        },
      }),
    );
    fsMock.stat.mockResolvedValueOnce({
      size: 99,
      mtime: new Date('2024-03-01T00:00:00.000Z'),
    });

    const fields: UpdateMediaMetadataFields = { tags: undefined };

    await expect(
      updateMediaMetadata('shop', '/uploads/shop/file.jpg', fields),
    ).resolves.toEqual({
      url: '/uploads/shop/file.jpg',
      title: undefined,
      altText: undefined,
      tags: undefined,
      type: 'image',
      size: 99,
      uploadedAt: '2024-03-01T00:00:00.000Z',
    });

    const [, metadata] = writeJsonFileMock.mock.calls[0];
    expect(metadata['file.jpg']).toEqual({
      type: 'image',
      size: 99,
      uploadedAt: '2024-03-01T00:00:00.000Z',
    });
  });

  it('throws when media file is missing', async () => {
    const error = Object.assign(new Error('missing'), { code: 'ENOENT' });
    fsMock.stat.mockRejectedValueOnce(error);
    await expect(
      updateMediaMetadata('shop', '/uploads/shop/missing.jpg', {}),
    ).rejects.toThrow('Media file not found');
  });

  it.each([
    '/uploads/other-shop/file.jpg',
    '/uploads/shop/../escape.jpg',
  ])('rejects invalid file url %s', async (url) => {
    await expect(updateMediaMetadata('shop', url, {})).rejects.toThrow(
      'Invalid file path',
    );
    expect(fsMock.stat).not.toHaveBeenCalled();
    expect(writeJsonFileMock).not.toHaveBeenCalled();
  });
});

