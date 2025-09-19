/** @jest-environment node */

import path from 'path';
import { File } from 'node:buffer';

import {
  fsMock,
  sharpMetadataMock,
  sharpToBufferMock,
  sharpMock,
  ulidMock,
  writeJsonFileMock,
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import { uploadMedia } from '../media.server';

describe('uploadMedia', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('throws when no file entry is provided', async () => {
    const formData = new FormData();
    await expect(uploadMedia('shop', formData)).rejects.toThrow('No file provided');
  });

  it('throws for invalid file entry type', async () => {
    const formData = new FormData();
    formData.append('file', 'not a file');
    await expect(uploadMedia('shop', formData)).rejects.toThrow('No file provided');
  });

  it('rejects images exceeding 5 MB', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append('file', new File([big], 'big.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('File too large');
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
    await expect(uploadMedia('shop', formData)).rejects.toThrow('Failed to process image');
  });

  it('propagates orientation errors from sharp', async () => {
    sharpToBufferMock.mockRejectedValueOnce(
      new Error('orientation must be a multiple of 90'),
    );
    const formData = new FormData();
    formData.append('file', new File(['data'], 'img.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow(
      'orientation must be a multiple of 90',
    );
  });

  it('rejects invalid mime types', async () => {
    const formData = new FormData();
    formData.append('file', new File(['data'], 'doc.txt', { type: 'text/plain' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('Invalid file type');
  });

  it('enforces 50 MB limit for videos', async () => {
    const big = Buffer.alloc(50 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append('file', new File([big], 'big.mp4', { type: 'video/mp4' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('File too large');
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

