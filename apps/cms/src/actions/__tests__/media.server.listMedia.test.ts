/** @jest-environment node */

import path from 'path';

import {
  fsMock,
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import { listMedia } from '../media.server';

describe('listMedia', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('lists files with metadata and filters metadata.json', async () => {
    fsMock.readdir.mockResolvedValueOnce(['a.jpg', 'metadata.json', 'b.mp4']);
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({
        'a.jpg': {
          title: 'A',
          altText: 'A alt',
          type: 'image',
          tags: ['hero'],
          uploadedAt: '2024-01-05T00:00:00.000Z',
          size: 321,
        },
        'b.mp4': {
          title: 'B',
          altText: 'B alt',
          type: 'video',
          tags: [],
          uploadedAt: '2024-01-06T00:00:00.000Z',
          size: 654,
        },
      }),
    );

    await expect(listMedia('shop')).resolves.toEqual([
      {
        url: '/uploads/shop/a.jpg',
        title: 'A',
        altText: 'A alt',
        tags: ['hero'],
        type: 'image',
        uploadedAt: '2024-01-05T00:00:00.000Z',
        size: 321,
      },
      {
        url: '/uploads/shop/b.mp4',
        title: 'B',
        altText: 'B alt',
        tags: [],
        type: 'video',
        uploadedAt: '2024-01-06T00:00:00.000Z',
        size: 654,
      },
    ]);
    expect(fsMock.readdir).toHaveBeenCalledWith(
      path.join(process.cwd(), 'public', 'uploads', 'shop'),
    );
    expect(fsMock.stat).not.toHaveBeenCalled();
  });

  it('returns files without metadata when metadata read fails', async () => {
    fsMock.readdir.mockResolvedValueOnce(['a.jpg', 'b.jpg']);
    fsMock.readFile.mockRejectedValueOnce(new Error('fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(listMedia('shop')).resolves.toEqual([
      {
        url: '/uploads/shop/a.jpg',
        title: undefined,
        altText: undefined,
        tags: undefined,
        type: 'image',
        uploadedAt: '2024-01-01T00:00:00.000Z',
        size: 1024,
      },
      {
        url: '/uploads/shop/b.jpg',
        title: undefined,
        altText: undefined,
        tags: undefined,
        type: 'image',
        uploadedAt: '2024-01-01T00:00:00.000Z',
        size: 1024,
      },
    ]);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('fills missing metadata from file stats', async () => {
    fsMock.readdir.mockResolvedValueOnce(['a.jpg']);
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({ 'a.jpg': { title: 'A' } }),
    );
    fsMock.stat.mockResolvedValueOnce({
      size: 2048,
      mtime: new Date('2024-02-01T12:00:00.000Z'),
    });

    await expect(listMedia('shop')).resolves.toEqual([
      {
        url: '/uploads/shop/a.jpg',
        title: 'A',
        altText: undefined,
        tags: undefined,
        type: 'image',
        uploadedAt: '2024-02-01T12:00:00.000Z',
        size: 2048,
      },
    ]);
    expect(fsMock.stat).toHaveBeenCalledWith(
      path.join(process.cwd(), 'public', 'uploads', 'shop', 'a.jpg'),
    );
  });

  it('throws when fs.readdir rejects', async () => {
    fsMock.readdir.mockRejectedValueOnce(new Error('boom'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(listMedia('shop')).rejects.toThrow('Failed to list media');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

