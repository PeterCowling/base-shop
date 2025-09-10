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
import {
  uploadsDir,
  metadataPath,
  readMetadata,
  writeMetadata,
  listMedia,
  uploadMedia,
  deleteMedia,
} from '../media.server';
import { ensureAuthorized } from '../common/auth';
import { validateShopName } from '@platform-core/shops';

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
    writeJsonFileMock.mockResolvedValue(undefined);
    ulidMock.mockReturnValue('id123');
    sharpMetadataMock.mockResolvedValue({ width: 200, height: 100 });
    sharpToBufferMock.mockResolvedValue(Buffer.from('data'));
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
          'a.jpg': { title: 'A', altText: 'A alt', type: 'image' },
          'b.mp4': { title: 'B', altText: 'B alt', type: 'video' },
        }),
      );

      await expect(listMedia('shop')).resolves.toEqual([
        {
          url: '/uploads/shop/a.jpg',
          title: 'A',
          altText: 'A alt',
          type: 'image',
        },
        {
          url: '/uploads/shop/b.mp4',
          title: 'B',
          altText: 'B alt',
          type: 'video',
        },
      ]);
      expect(fsMock.readdir).toHaveBeenCalledWith(
        path.join(process.cwd(), 'public', 'uploads', 'shop'),
      );
    });

    it('throws when fs.readdir rejects', async () => {
      fsMock.readdir.mockRejectedValueOnce(new Error('boom'));
      await expect(listMedia('shop')).rejects.toThrow('Failed to list media');
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
      await expect(uploadMedia('shop', formData)).resolves.toEqual({
        url: '/uploads/shop/img123.jpg',
        title: 'My Image',
        altText: 'alt',
        type: 'image',
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
        { 'img123.jpg': { title: 'My Image', altText: 'alt', type: 'image' } },
      );
    });

    it('uploads a video file', async () => {
      ulidMock.mockReturnValueOnce('vid123');
      const formData = new FormData();
      formData.append('file', new File(['vid'], 'movie.mp4', { type: 'video/mp4' }));
      await expect(uploadMedia('shop', formData)).resolves.toEqual({
        url: '/uploads/shop/vid123.mp4',
        title: undefined,
        altText: undefined,
        type: 'video',
      });
      expect(sharpMock).not.toHaveBeenCalled();
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

    it('ignores missing files', async () => {
      fsMock.unlink.mockRejectedValueOnce(new Error('missing'));
      fsMock.readFile.mockResolvedValueOnce('{}');
      await expect(
        deleteMedia('shop', '/uploads/shop/missing.jpg'),
      ).resolves.toBeUndefined();
    });
  });
});

