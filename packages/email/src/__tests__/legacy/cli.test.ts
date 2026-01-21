import { afterEach, beforeEach, describe, expect, jest,test } from '@jest/globals';
import path from 'path';

const mockFs = () => {
  const readFile = jest.fn();
  const writeFile = jest.fn();
  const mkdir = jest.fn();
  const existsSync = jest.fn();
  return {
    __esModule: true,
    promises: { readFile, writeFile, mkdir },
    existsSync,
  };
};

describe('email cli', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('resolveDataRoot finds existing folder in parent', async () => {
    const fs = mockFs();
    fs.existsSync.mockImplementation((p: string) => p === path.join('/root', 'data', 'shops'));
    jest.doMock('fs', () => fs);
    jest.doMock('../../scheduler', () => ({ sendDueCampaigns: jest.fn() }));
    jest.doMock('@acme/date-utils', () => ({ nowIso: () => '2020-01-01T00:00:00.000Z' }));
    jest.doMock('@acme/lib', () => ({ validateShopName: (s: string) => s }));
    jest.doMock('@acme/i18n/useTranslations.server', () => ({
      useTranslations: () => Promise.resolve((key: string) => key),
    }));
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/root/project');

    const { resolveDataRoot } = await import('../../cli');
    expect(resolveDataRoot()).toBe(path.join('/root', 'data', 'shops'));

    cwdSpy.mockRestore();
  });

  test('readCampaigns returns empty array on read error', async () => {
    const fs = mockFs();
    fs.existsSync.mockReturnValue(true);
    fs.promises.readFile.mockRejectedValue(new Error('fail'));
    jest.doMock('fs', () => fs);
    jest.doMock('../../scheduler', () => ({ sendDueCampaigns: jest.fn() }));
    jest.doMock('@acme/date-utils', () => ({ nowIso: () => '2020-01-01T00:00:00.000Z' }));
    jest.doMock('@acme/lib', () => ({ validateShopName: (s: string) => s }));
    jest.doMock('@acme/i18n/useTranslations.server', () => ({
      useTranslations: () => Promise.resolve((key: string) => key),
    }));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { run } = await import('../../cli');
    await run(['node', 'cli', 'campaign', 'list', 'shop']);
    expect(log).toHaveBeenCalledWith('[]');

    log.mockRestore();
  });

  test('campaign create with recipients', async () => {
    const fs = mockFs();
    fs.existsSync.mockReturnValue(true);
    fs.promises.readFile.mockResolvedValue('[]');
    fs.promises.writeFile.mockResolvedValue(undefined as any);
    fs.promises.mkdir.mockResolvedValue(undefined as any);
    jest.doMock('fs', () => fs);
    jest.doMock('../../scheduler', () => ({ sendDueCampaigns: jest.fn() }));
    jest.doMock('@acme/date-utils', () => ({ nowIso: () => '2020-01-01T00:00:00.000Z' }));
    jest.doMock('@acme/lib', () => ({ validateShopName: (s: string) => s }));
    jest.doMock('@acme/i18n/useTranslations.server', () => ({
      useTranslations: () => Promise.resolve((key: string) => key),
    }));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { run } = await import('../../cli');
    await run([
      'node',
      'cli',
      'campaign',
      'create',
      'shop',
      '--subject',
      'Hi',
      '--body',
      '<p>Hi</p>',
      '--send-at',
      '2020-01-01T00:00:00.000Z',
      '--recipients',
      'a@example.com,b@example.com',
    ]);

    const data = JSON.parse(fs.promises.writeFile.mock.calls[0][1]);
    expect(data[0].recipients).toEqual(['a@example.com', 'b@example.com']);

    log.mockRestore();
  });

  test('campaign create without recipients', async () => {
    const fs = mockFs();
    fs.existsSync.mockReturnValue(true);
    fs.promises.readFile.mockResolvedValue('[]');
    fs.promises.writeFile.mockResolvedValue(undefined as any);
    fs.promises.mkdir.mockResolvedValue(undefined as any);
    jest.doMock('fs', () => fs);
    jest.doMock('../../scheduler', () => ({ sendDueCampaigns: jest.fn() }));
    jest.doMock('@acme/date-utils', () => ({ nowIso: () => '2020-01-01T00:00:00.000Z' }));
    jest.doMock('@acme/lib', () => ({ validateShopName: (s: string) => s }));
    jest.doMock('@acme/i18n/useTranslations.server', () => ({
      useTranslations: () => Promise.resolve((key: string) => key),
    }));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { run } = await import('../../cli');
    await run([
      'node',
      'cli',
      'campaign',
      'create',
      'shop',
      '--subject',
      'Hi',
      '--body',
      '<p>Hi</p>',
      '--send-at',
      '2020-01-01T00:00:00.000Z',
    ]);

    const data = JSON.parse(fs.promises.writeFile.mock.calls[0][1]);
    expect(data[0].recipients).toEqual([]);

    log.mockRestore();
  });
});
