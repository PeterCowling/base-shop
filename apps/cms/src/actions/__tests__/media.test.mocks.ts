/** @jest-environment node */

const fsMock = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
};

jest.mock('../common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock('@platform-core/shops', () => ({
  validateShopName: jest.fn((s: string) => s),
}));

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

import { ensureAuthorized } from '../common/auth';
import { validateShopName } from '@platform-core/shops';

type DefaultStat = { size: number; mtime: Date };

const defaultStat = (): DefaultStat => ({
  size: 1024,
  mtime: new Date('2024-01-01T00:00:00.000Z'),
});

const configureSharp = () => {
  sharpMetadataMock.mockResolvedValue({ width: 200, height: 100 });
  sharpToBufferMock.mockResolvedValue(Buffer.from('data'));
  sharpMock.mockImplementation(() => ({
    metadata: sharpMetadataMock,
    toBuffer: sharpToBufferMock,
  }));
};

export const resetMediaMocks = () => {
  jest.clearAllMocks();
  jest.useRealTimers();

  (ensureAuthorized as jest.Mock).mockResolvedValue({});
  (validateShopName as jest.Mock).mockImplementation((s: string) => s);

  fsMock.readFile.mockResolvedValue('{}');
  fsMock.writeFile.mockResolvedValue(undefined);
  fsMock.mkdir.mockResolvedValue(undefined);
  fsMock.readdir.mockResolvedValue([]);
  fsMock.unlink.mockResolvedValue(undefined);
  fsMock.stat.mockResolvedValue(defaultStat());

  writeJsonFileMock.mockResolvedValue(undefined);
  ulidMock.mockReturnValue('id123');

  configureSharp();
};

export const restoreMediaMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.useRealTimers();
};

export {
  fsMock,
  sharpMetadataMock,
  sharpToBufferMock,
  sharpMock,
  ulidMock,
  writeJsonFileMock,
  ensureAuthorized,
  validateShopName,
};
