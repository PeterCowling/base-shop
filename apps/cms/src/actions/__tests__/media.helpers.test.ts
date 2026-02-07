/** @jest-environment node */

import path from 'path';

import { metadataPath, readMetadata, uploadsDir, writeMetadata } from '../media.helpers';

import {
  fsMock,
  resetMediaMocks,
  restoreMediaMocks,
  writeJsonFileMock,
} from './media.test.mocks';

describe('media helpers', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

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
});

