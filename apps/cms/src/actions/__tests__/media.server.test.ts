/** @jest-environment node */

jest.mock('../common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

const fsMock = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
};

jest.mock('fs', () => ({ promises: fsMock }));

const sharpMock = jest.fn();

jest.mock('sharp', () => ({
  __esModule: true,
  default: sharpMock,
}));

const ulidMock = jest.fn();

jest.mock('ulid', () => ({ ulid: ulidMock }));

import { File } from 'node:buffer';
import { uploadMedia } from '../media.server';
import { ensureAuthorized } from '../common/auth';

describe('uploadMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ensureAuthorized as jest.Mock).mockResolvedValue({});
    fsMock.readFile.mockResolvedValue('{}');
    fsMock.writeFile.mockResolvedValue(undefined);
    fsMock.mkdir.mockResolvedValue(undefined);
    ulidMock.mockReturnValue('id123');
  });

  it('throws when not authorized', async () => {
    (ensureAuthorized as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
    const formData = new FormData();
    formData.append('file', new File(['data'], 'file.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('Unauthorized');
    expect(fsMock.writeFile).not.toHaveBeenCalled();
  });

  it('throws for missing file input', async () => {
    const formData = new FormData();
    await expect(uploadMedia('shop', formData)).rejects.toThrow('No file provided');
  });

  it('throws when storage fails', async () => {
    fsMock.writeFile.mockRejectedValue(new Error('disk full'));
    sharpMock.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ width: 200, height: 100 }),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    });
    const formData = new FormData();
    formData.append('file', new File(['img'], 'img.jpg', { type: 'image/jpeg' }));
    await expect(uploadMedia('shop', formData)).rejects.toThrow('disk full');
  });

  it('uploads an image and returns metadata', async () => {
    ulidMock.mockReturnValue('img123');
    sharpMock.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ width: 200, height: 100 }),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    });
    const formData = new FormData();
    formData.append('file', new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
    formData.append('title', 'My Image');
    formData.append('altText', 'alt');
    const result = await uploadMedia('shop', formData);
    expect(result).toEqual({
      url: '/uploads/shop/img123.jpg',
      title: 'My Image',
      altText: 'alt',
      type: 'image',
    });
    expect(fsMock.writeFile).toHaveBeenCalledTimes(2);
    expect(sharpMock).toHaveBeenCalled();
  });

  it('uploads a video file', async () => {
    ulidMock.mockReturnValue('vid123');
    const formData = new FormData();
    formData.append('file', new File(['vid'], 'movie.mp4', { type: 'video/mp4' }));
    const result = await uploadMedia('shop', formData);
    expect(result).toEqual({
      url: '/uploads/shop/vid123.mp4',
      title: undefined,
      altText: undefined,
      type: 'video',
    });
    expect(sharpMock).not.toHaveBeenCalled();
  });
});
