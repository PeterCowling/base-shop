/** @jest-environment node */

jest.mock('../common/auth', () => ({
  ensureAuthorized: jest.fn().mockResolvedValue({}),
}));

const fsMock = {
  readFile: jest.fn().mockResolvedValue('{}'),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
};

jest.mock('fs', () => ({ promises: fsMock }));

const sharpMock = jest.fn();

jest.mock('sharp', () => ({
  __esModule: true,
  default: sharpMock,
}));

import { uploadMedia, deleteMedia } from '../media.server';

describe('uploadMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws for portrait images when landscape required', async () => {
    sharpMock.mockReturnValue({
      metadata: jest.fn().mockResolvedValue({ width: 100, height: 200 }),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    });

    const file = new File(['dummy'], 'portrait.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.set('file', file);

    await expect(uploadMedia('shop', formData)).rejects.toThrow(
      'Image orientation must be landscape',
    );
  });

  it('throws for invalid file type', async () => {
    const file = new File(['dummy'], 'file.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.set('file', file);

    await expect(uploadMedia('shop', formData)).rejects.toThrow(
      'Invalid file type',
    );
    expect(sharpMock).not.toHaveBeenCalled();
  });
});

describe('deleteMedia', () => {
  it('rejects malformed file paths', async () => {
    const invalidPaths = [
      '/uploads/other/file.jpg',
      '/uploads/shop/../evil.jpg',
      '/evil.jpg',
    ];

    for (const p of invalidPaths) {
      await expect(deleteMedia('shop', p)).rejects.toThrow('Invalid file path');
    }
  });
});
