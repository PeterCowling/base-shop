/** @jest-environment node */

import { File as NodeFile } from 'node:buffer';

import { ensureAuthorized } from '../actions/common/auth';
import { deleteMedia,listMedia, uploadMedia } from '../actions/media.server';
// Cast to globalThis.File since buffer.File lacks webkitRelativePath
const File = NodeFile as unknown as typeof globalThis.File;

jest.mock('../actions/common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

const fsMock = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  rename: jest.fn(),
};
jest.mock('fs', () => ({ promises: fsMock }));

const pathMock = {
  join: (...parts: string[]) => parts.join('/'),
  dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
  posix: {
    join: (...parts: string[]) => parts.join('/'),
    normalize: (p: string) => p,
  },
  extname: (f: string) => {
    const idx = f.lastIndexOf('.');
    return idx >= 0 ? f.slice(idx) : '';
  },
  relative: (from: string, to: string) =>
    to.startsWith(from + '/') ? to.slice(from.length + 1) : '../' + to,
  isAbsolute: (p: string) => p.startsWith('/'),
};
jest.mock('path', () => pathMock as any);

const sharpMock = jest.fn();
jest.mock('sharp', () => ({ __esModule: true, default: sharpMock }));

const ulidMock = jest.fn();
jest.mock('ulid', () => ({ ulid: ulidMock }));

beforeEach(() => {
  jest.clearAllMocks();
  (ensureAuthorized as jest.Mock).mockResolvedValue(undefined);
  fsMock.readFile.mockResolvedValue('{}');
  fsMock.writeFile.mockResolvedValue(undefined);
  fsMock.readdir.mockResolvedValue([]);
  fsMock.mkdir.mockResolvedValue(undefined);
  fsMock.unlink.mockResolvedValue(undefined);
  fsMock.rename.mockResolvedValue(undefined);
  ulidMock.mockReturnValue('id123');
});

describe('listMedia', () => {
  it('lists media files with metadata', async () => {
    fsMock.readdir.mockResolvedValue(['img.jpg', 'vid.mp4', 'metadata.json']);
    fsMock.readFile.mockResolvedValue(
      JSON.stringify({
        'img.jpg': { title: 'Image', altText: 'Alt', type: 'image' },
        'vid.mp4': { title: 'Video', type: 'video' },
      }),
    );

    const result = await listMedia('shop');
    expect(result).toEqual([
      expect.objectContaining({
        url: '/uploads/shop/img.jpg',
        title: 'Image',
        altText: 'Alt',
        type: 'image',
      }),
      expect.objectContaining({
        url: '/uploads/shop/vid.mp4',
        title: 'Video',
        altText: undefined,
        type: 'video',
      }),
    ]);
  });

  it('throws when reading directory fails', async () => {
    fsMock.readdir.mockRejectedValue(new Error('boom'));
    await expect(listMedia('shop')).rejects.toThrow('Failed to list media');
  });

  it('returns empty metadata when metadata file cannot be read', async () => {
    fsMock.readdir.mockResolvedValue(['img.jpg']);
    fsMock.readFile.mockRejectedValue(new Error('nope'));
    const result = await listMedia('shop');
    expect(result).toEqual([
      expect.objectContaining({
        url: '/uploads/shop/img.jpg',
        title: undefined,
        altText: undefined,
        type: 'image',
      }),
    ]);
  });
});

describe('uploadMedia', () => {
  it('fails when no file is provided', async () => {
    const formData = new FormData();
    await expect(uploadMedia('shop', formData)).rejects.toThrow('No file provided');
  });

  it('uploads image files and updates metadata', async () => {
    sharpMock.mockImplementation(() => ({
      metadata: jest.fn().mockResolvedValue({ width: 200, height: 100 }),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    }));
    const formData = new FormData();
    formData.append('file', new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
    formData.append('title', 'My Image');
    formData.append('altText', 'Alt text');

    const res = await uploadMedia('shop', formData);
    expect(res).toMatchObject({
      url: '/uploads/shop/id123.jpg',
      title: 'My Image',
      altText: 'Alt text',
      type: 'image',
      size: expect.any(Number),
      uploadedAt: expect.any(String),
    });
    expect(Date.parse(res.uploadedAt ?? '')).not.toBeNaN();

    const meta = JSON.parse(
      fsMock.writeFile.mock.calls[fsMock.writeFile.mock.calls.length - 1][1],
    );
    expect(meta['id123.jpg']).toMatchObject({
      title: 'My Image',
      altText: 'Alt text',
      type: 'image',
      size: expect.any(Number),
      uploadedAt: expect.any(String),
    });
    expect(meta['id123.jpg'].size).toBe(res.size);
    expect(meta['id123.jpg'].uploadedAt).toBe(res.uploadedAt);
  });

  it('uploads video files without using sharp', async () => {
    const formData = new FormData();
    formData.append('file', new File(['vid'], 'movie.mp4', { type: 'video/mp4' }));
    const res = await uploadMedia('shop', formData);
    expect(res).toMatchObject({
      url: '/uploads/shop/id123.mp4',
      title: undefined,
      altText: undefined,
      type: 'video',
      size: expect.any(Number),
      uploadedAt: expect.any(String),
    });
    expect(Date.parse(res.uploadedAt ?? '')).not.toBeNaN();
    expect(sharpMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported file types', async () => {
    const formData = new FormData();
    formData.append('file', new File(['txt'], 'note.txt', { type: 'text/plain' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('Invalid file type');
  });

  it('rejects oversized files', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append('file', new File([big], 'big.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('File too large');
  });

  it('rejects videos that exceed the size limit', async () => {
    const big = Buffer.alloc(50 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append('file', new File([big], 'big.mp4', { type: 'video/mp4' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('File too large');
  });

  it('fails when sharp throws a non-orientation error', async () => {
    sharpMock.mockImplementation(() => ({
      metadata: jest.fn().mockResolvedValue({ width: 200, height: 100 }),
      toBuffer: jest.fn().mockRejectedValue(new Error('sharp fail')),
    }));
    const formData = new FormData();
    formData.append('file', new File(['img'], 'bad.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow(
      'Failed to process image',
    );
  });

  it('rejects landscape orientation when portrait is required', async () => {
    sharpMock.mockImplementation(() => ({
      metadata: jest.fn().mockResolvedValue({ width: 200, height: 100 }),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    }));
    const formData = new FormData();
    formData.append('file', new File(['img'], 'pic.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData, 'portrait')).rejects.toThrow(
      'Image orientation must be portrait',
    );
  });

  it('rejects portrait orientation when landscape is required', async () => {
    sharpMock.mockImplementation(() => ({
      metadata: jest.fn().mockResolvedValue({ width: 100, height: 200 }),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    }));
    const formData = new FormData();
    formData.append('file', new File(['img'], 'pic.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow(
      'Image orientation must be landscape',
    );
  });
});

describe('deleteMedia', () => {
  it('rejects invalid paths', async () => {
    await expect(deleteMedia('shop', '/evil/path.jpg')).rejects.toThrow('Invalid file path');
    expect(fsMock.unlink).not.toHaveBeenCalled();
  });

  it('deletes files and updates metadata', async () => {
    fsMock.readFile.mockResolvedValue(
      JSON.stringify({ 'id123.jpg': { title: 't', type: 'image' }, other: { title: 'o', type: 'image' } }),
    );
    await deleteMedia('shop', '/uploads/shop/id123.jpg');
    expect(fsMock.unlink).toHaveBeenCalled();
    const meta = JSON.parse(fsMock.writeFile.mock.calls[0][1]);
    expect(meta).toEqual({ other: { title: 'o', type: 'image' } });
  });

  it('does not rewrite metadata when file is absent', async () => {
    fsMock.readFile.mockResolvedValue(
      JSON.stringify({ other: { title: 'o', type: 'image' } }),
    );
    await deleteMedia('shop', '/uploads/shop/missing.jpg');
    expect(fsMock.unlink).toHaveBeenCalled();
    expect(fsMock.writeFile).not.toHaveBeenCalled();
  });
});
