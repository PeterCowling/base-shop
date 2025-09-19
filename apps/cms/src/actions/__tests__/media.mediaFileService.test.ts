/** @jest-environment node */

import path from 'path';
import { File } from 'node:buffer';

import {
  fsMock,
  writeJsonFileMock,
  sharpMetadataMock,
  ulidMock,
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import {
  listMediaFiles,
  uploadMediaFile,
  deleteMediaFile,
  inferMediaType,
} from '../media/mediaFileService';

describe('mediaFileService', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  describe('listMediaFiles', () => {
    it('merges metadata with directory entries', async () => {
      fsMock.readdir.mockResolvedValueOnce(['one.jpg', 'metadata.json', 'two.mp4']);
      fsMock.readFile.mockResolvedValueOnce(
        JSON.stringify({
          'one.jpg': {
            title: 'One',
            altText: 'first',
            type: 'image',
            tags: ['hero'],
            uploadedAt: '2024-05-01T00:00:00.000Z',
            size: 111,
          },
        }),
      );

      await expect(listMediaFiles('shop')).resolves.toEqual([
        {
          url: '/uploads/shop/one.jpg',
          title: 'One',
          altText: 'first',
          tags: ['hero'],
          type: 'image',
          size: 111,
          uploadedAt: '2024-05-01T00:00:00.000Z',
        },
        {
          url: '/uploads/shop/two.mp4',
          title: undefined,
          altText: undefined,
          tags: undefined,
          type: 'video',
          size: 1024,
          uploadedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('falls back to fs.stat when metadata is missing', async () => {
      fsMock.readdir.mockResolvedValueOnce(['missing.jpg']);
      fsMock.readFile.mockResolvedValueOnce('{}');
      fsMock.stat.mockResolvedValueOnce({
        size: 222,
        mtime: new Date('2024-06-01T00:00:00.000Z'),
      });

      await expect(listMediaFiles('shop')).resolves.toEqual([
        {
          url: '/uploads/shop/missing.jpg',
          title: undefined,
          altText: undefined,
          tags: undefined,
          type: 'image',
          size: 222,
          uploadedAt: '2024-06-01T00:00:00.000Z',
        },
      ]);
      expect(fsMock.stat).toHaveBeenCalledWith(
        path.join(process.cwd(), 'public', 'uploads', 'shop', 'missing.jpg'),
      );
    });

    it('propagates filesystem errors', async () => {
      const boom = new Error('boom');
      fsMock.readdir.mockRejectedValueOnce(boom);
      await expect(listMediaFiles('shop')).rejects.toBe(boom);
    });
  });

  describe('uploadMediaFile', () => {
    it('uploads an image and normalizes tags', async () => {
      ulidMock.mockReturnValueOnce('svc123');
      const now = new Date('2024-08-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

      await expect(
        uploadMediaFile({
          shop: 'shop',
          file,
          title: 'Title',
          altText: 'Alt',
          tags: ['featured', ' featured '],
        }),
      ).resolves.toEqual({
        url: '/uploads/shop/svc123.jpg',
        title: 'Title',
        altText: 'Alt',
        tags: ['featured'],
        type: 'image',
        size: 3,
        uploadedAt: '2024-08-01T00:00:00.000Z',
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
          'svc123.jpg': expect.objectContaining({
            title: 'Title',
            altText: 'Alt',
            tags: ['featured'],
            type: 'image',
            size: 3,
            uploadedAt: '2024-08-01T00:00:00.000Z',
          }),
        },
      );

      jest.useRealTimers();
    });

    it('enforces image orientation when required', async () => {
      sharpMetadataMock.mockResolvedValueOnce({ width: 300, height: 500 });
      const file = new File(['img'], 'portrait.jpg', { type: 'image/jpeg' });

      await expect(
        uploadMediaFile({
          shop: 'shop',
          file,
          requiredOrientation: 'landscape',
        }),
      ).rejects.toThrow('Image orientation must be landscape');
    });

    it('rejects unsupported mime types', async () => {
      const file = new File(['text'], 'note.txt', { type: 'text/plain' });
      await expect(uploadMediaFile({ shop: 'shop', file })).rejects.toThrow(
        'Invalid file type',
      );
    });
  });

  describe('deleteMediaFile', () => {
    it('rejects paths outside the uploads directory', async () => {
      await expect(
        deleteMediaFile('shop', '/uploads/shop/../escape.jpg'),
      ).rejects.toThrow('Invalid file path');
    });

    it('removes metadata when the file is deleted', async () => {
      fsMock.readFile.mockResolvedValueOnce('{"file.jpg":{"title":"t"}}');
      await deleteMediaFile('shop', '/uploads/shop/file.jpg');
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
  });

  it('infers media type from extension and metadata', () => {
    expect(inferMediaType('video.mp4')).toBe('video');
    expect(inferMediaType('photo.png')).toBe('image');
    expect(inferMediaType('asset.bin', 'video')).toBe('video');
  });
});
