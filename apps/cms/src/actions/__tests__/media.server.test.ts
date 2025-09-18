/** @jest-environment node */

jest.mock('../common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));
jest.mock('@platform-core/shops', () => ({
  validateShopName: jest.fn((s: string) => s),
}));

const fsMock = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
};
jest.mock('fs', () => ({ promises: fsMock }));

const sharpMetadataMock = jest.fn();
const sharpToBufferMock = jest.fn();
const sharpMock = jest.fn(() => ({
  metadata: sharpMetadataMock,
  toBuffer: sharpToBufferMock,
}));
jest.mock('sharp', () => ({
  __esModule: true,
  default: sharpMock,
}));

const ulidMock = jest.fn();
jest.mock('ulid', () => ({ ulid: ulidMock }));

const writeJsonFileMock = jest.fn();
jest.mock('@/lib/server/jsonIO', () => ({ writeJsonFile: writeJsonFileMock }));

import path from 'path';
import { File } from 'node:buffer';
import * as mediaActions from '../media';
import type { UpdateMediaMetadataFields } from '../media';
import * as mediaHelpers from '../media.helpers';
import { ensureAuthorized } from '../common/auth';
import { validateShopName } from '@platform-core/shops';

const { listMedia, uploadMedia, deleteMedia, updateMediaMetadata, getMediaOverview } =
  mediaActions;
const { uploadsDir, metadataPath, readMetadata, writeMetadata } = mediaHelpers;

describe('media.server helpers and actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ensureAuthorized as jest.Mock).mockResolvedValue({});
    (validateShopName as jest.Mock).mockImplementation((s: string) => s);
    fsMock.readFile.mockResolvedValue('{}');
    fsMock.writeFile.mockResolvedValue(undefined);
    fsMock.mkdir.mockResolvedValue(undefined);
    fsMock.readdir.mockResolvedValue([]);
    fsMock.unlink.mockResolvedValue(undefined);
    fsMock.stat.mockResolvedValue({
      size: 1024,
      mtime: new Date('2024-01-01T00:00:00.000Z'),
    });
    writeJsonFileMock.mockResolvedValue(undefined);
    ulidMock.mockReturnValue('id123');
    sharpMetadataMock.mockResolvedValue({ width: 200, height: 100 });
    sharpToBufferMock.mockResolvedValue(Buffer.from('data'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('path helpers', () => {
    it('uploadsDir resolves using cwd and shop name', () => {
      expect(uploadsDir('shop')).toBe(
        path.join(process.cwd(), 'public', 'uploads', 'shop'),
      );
    });

    it('metadataPath resolves to metadata.json inside uploadsDir', () => {
      expect(metadataPath('shop')).toBe(
        path.join(process.cwd(), 'public', 'uploads', 'shop', 'metadata.json'),
      );
    });
  });

  describe('metadata helpers', () => {
    it('readMetadata returns empty object when missing or unreadable', async () => {
      fsMock.readFile.mockRejectedValueOnce(new Error('missing'));
      expect(await readMetadata('shop')).toEqual({});
      fsMock.readFile.mockResolvedValueOnce('not-json');
      expect(await readMetadata('shop')).toEqual({});
    });

    it('readMetadata parses JSON when available', async () => {
      fsMock.readFile.mockResolvedValueOnce('{"img.jpg":{"title":"t"}}');
      await expect(readMetadata('shop')).resolves.toEqual({
        'img.jpg': { title: 't' },
      });
    });

    it('normalizes metadata with extended fields', async () => {
      fsMock.readFile.mockResolvedValueOnce(
        JSON.stringify({
          'img.jpg': {
            title: 't',
            altText: 'alt',
            type: 'video',
            tags: 'tag1, tag2',
            uploadedAt: '2024-01-02T00:00:00.000Z',
            size: 2048,
          },
        }),
      );
      await expect(readMetadata('shop')).resolves.toEqual({
        'img.jpg': {
          title: 't',
          altText: 'alt',
          type: 'video',
          tags: ['tag1', 'tag2'],
          uploadedAt: '2024-01-02T00:00:00.000Z',
          size: 2048,
        },
      });
    });

    it('writeMetadata writes to metadata.json', async () => {
      await writeMetadata('shop', { foo: { title: 'bar' } });
      expect(writeJsonFileMock).toHaveBeenCalledWith(
        path.join(
          process.cwd(),
          'public',
          'uploads',
          'shop',
          'metadata.json',
        ),
        { foo: { title: 'bar' } },
      );
    });
  });

  describe('listMedia', () => {
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

  describe('uploadMedia', () => {
    it('throws when no file entry is provided', async () => {
      const formData = new FormData();
      await expect(uploadMedia('shop', formData)).rejects.toThrow(
        'No file provided',
      );
    });

    it('throws for invalid file entry type', async () => {
      const formData = new FormData();
      formData.append('file', 'not a file');
      await expect(uploadMedia('shop', formData)).rejects.toThrow(
        'No file provided',
      );
    });

    it('rejects images exceeding 5 MB', async () => {
      const big = Buffer.alloc(5 * 1024 * 1024 + 1);
      const formData = new FormData();
      formData.append(
        'file',
        new File([big], 'big.jpg', { type: 'image/jpeg' }),
      );
      await expect(uploadMedia('shop', formData)).rejects.toThrow(
        'File too large',
      );
    });

    it('checks orientation for landscape images', async () => {
      sharpMetadataMock.mockResolvedValueOnce({ width: 100, height: 200 });
      const formData = new FormData();
      formData.append('file', new File(['data'], 'img.jpg', { type: 'image/jpeg' }));
      await expect(uploadMedia('shop', formData, 'landscape')).rejects.toThrow(
        'Image orientation must be landscape',
      );
    });

    it('checks orientation for portrait images', async () => {
      sharpMetadataMock.mockResolvedValueOnce({ width: 200, height: 100 });
      const formData = new FormData();
      formData.append('file', new File(['data'], 'img.jpg', { type: 'image/jpeg' }));
      await expect(uploadMedia('shop', formData, 'portrait')).rejects.toThrow(
        'Image orientation must be portrait',
      );
    });

    it('allows upload when metadata lacks dimensions even with required orientation', async () => {
      sharpMetadataMock.mockResolvedValueOnce({});
      ulidMock.mockReturnValueOnce('img456');
      const formData = new FormData();
      formData.append('file', new File(['data'], 'photo.jpg', { type: 'image/jpeg' }));
      const now = new Date('2024-03-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      await expect(uploadMedia('shop', formData, 'landscape')).resolves.toEqual({
        url: '/uploads/shop/img456.jpg',
        title: undefined,
        altText: undefined,
        tags: undefined,
        type: 'image',
        size: 4,
        uploadedAt: '2024-03-01T00:00:00.000Z',
      });
      jest.useRealTimers();
    });

    it('fails when sharp processing throws', async () => {
      sharpToBufferMock.mockRejectedValueOnce(new Error('fail'));
      const formData = new FormData();
      formData.append('file', new File(['data'], 'img.jpg', { type: 'image/jpeg' }));
      await expect(uploadMedia('shop', formData)).rejects.toThrow(
        'Failed to process image',
      );
    });

    it('propagates orientation errors from sharp', async () => {
      sharpToBufferMock.mockRejectedValueOnce(
        new Error('orientation must be a multiple of 90'),
      );
      const formData = new FormData();
      formData.append(
        'file',
        new File(['data'], 'img.jpg', { type: 'image/jpeg' }),
      );
      await expect(uploadMedia('shop', formData)).rejects.toThrow(
        'orientation must be a multiple of 90',
      );
    });

    it('rejects invalid mime types', async () => {
      const formData = new FormData();
      formData.append('file', new File(['data'], 'doc.txt', { type: 'text/plain' }));
      await expect(uploadMedia('shop', formData)).rejects.toThrow(
        'Invalid file type',
      );
    });

    it('enforces 50 MB limit for videos', async () => {
      const big = Buffer.alloc(50 * 1024 * 1024 + 1);
      const formData = new FormData();
      formData.append('file', new File([big], 'big.mp4', { type: 'video/mp4' }));
      await expect(uploadMedia('shop', formData)).rejects.toThrow(
        'File too large',
      );
    });

    it('uploads an image and updates metadata', async () => {
      ulidMock.mockReturnValueOnce('img123');
      const formData = new FormData();
      formData.append('file', new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
      formData.append('title', 'My Image');
      formData.append('altText', 'alt');
      const now = new Date('2024-05-01T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      await expect(uploadMedia('shop', formData)).resolves.toEqual({
        url: '/uploads/shop/img123.jpg',
        title: 'My Image',
        altText: 'alt',
        tags: undefined,
        type: 'image',
        size: 3,
        uploadedAt: '2024-05-01T12:00:00.000Z',
      });
      expect(sharpMock).toHaveBeenCalled();
      expect(fsMock.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'public', 'uploads', 'shop', 'img123.jpg'),
        expect.any(Buffer),
      );
      expect(writeJsonFileMock).toHaveBeenCalledWith(
        path.join(
          process.cwd(),
          'public',
          'uploads',
          'shop',
          'metadata.json',
        ),
        {
          'img123.jpg': {
            title: 'My Image',
            altText: 'alt',
            type: 'image',
            size: 3,
            uploadedAt: '2024-05-01T12:00:00.000Z',
          },
        },
      );
      jest.useRealTimers();
    });

    it('persists tags parsed from form data', async () => {
      ulidMock.mockReturnValueOnce('img999');
      const formData = new FormData();
      formData.append('file', new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
      formData.append('tags', '["featured"," hero "]');
      const now = new Date('2024-07-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      await expect(uploadMedia('shop', formData)).resolves.toEqual({
        url: '/uploads/shop/img999.jpg',
        title: undefined,
        altText: undefined,
        tags: ['featured', 'hero'],
        type: 'image',
        size: 3,
        uploadedAt: '2024-07-01T00:00:00.000Z',
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
          'img999.jpg': expect.objectContaining({
            tags: ['featured', 'hero'],
            size: 3,
            uploadedAt: '2024-07-01T00:00:00.000Z',
          }),
        },
      );
      jest.useRealTimers();
    });

    it('uploads a video file', async () => {
      ulidMock.mockReturnValueOnce('vid123');
      const formData = new FormData();
      formData.append('file', new File(['vid'], 'movie.mp4', { type: 'video/mp4' }));
      const now = new Date('2024-06-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      await expect(uploadMedia('shop', formData)).resolves.toEqual({
        url: '/uploads/shop/vid123.mp4',
        title: undefined,
        altText: undefined,
        tags: undefined,
        type: 'video',
        size: 3,
        uploadedAt: '2024-06-01T00:00:00.000Z',
      });
      jest.useRealTimers();
      expect(sharpMock).not.toHaveBeenCalled();
    });
  });

  describe('updateMediaMetadata', () => {
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

  describe('getMediaOverview', () => {
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

  describe('deleteMedia', () => {
    it('rejects paths outside uploads directory', async () => {
      await expect(deleteMedia('shop', '/uploads/other/file.jpg')).rejects.toThrow(
        'Invalid file path',
      );
      await expect(deleteMedia('shop', '/etc/passwd')).rejects.toThrow(
        'Invalid file path',
      );
      await expect(
        deleteMedia('shop', '/uploads/shop/../escape.jpg'),
      ).rejects.toThrow('Invalid file path');
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
      await expect(
        deleteMedia('shop', '/uploads/shop/missing.jpg'),
      ).resolves.toBeUndefined();
      expect(writeMetadataSpy).not.toHaveBeenCalled();
    });
  });
});

