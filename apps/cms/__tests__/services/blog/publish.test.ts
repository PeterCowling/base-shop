/* eslint-env jest */

import { nowIso } from '@acme/date-utils';

import { publishPost } from '../../../src/services/blog/posts/publish';

jest.mock('../../../src/actions/common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock('../../../src/services/blog/config', () => ({
  getConfig: jest.fn().mockResolvedValue({}),
}));

const repoPublishPost = jest.fn();

jest.mock('@acme/platform-core/repositories/blog.server', () => ({
  publishPost: (...args: unknown[]) => repoPublishPost(...args),
}));

jest.mock('@acme/date-utils', () => ({
  nowIso: jest.fn(),
}));

describe('publishPost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses current time when publishedAt not provided', async () => {
    (nowIso as jest.Mock).mockReturnValue('2024-01-01T00:00:00.000Z');
    repoPublishPost.mockResolvedValue(undefined);

    const fd = new FormData();
    const result = await publishPost('shop', '1', fd);

    expect(repoPublishPost).toHaveBeenCalledWith({}, '1', '2024-01-01T00:00:00.000Z');
    expect(result).toEqual({ message: 'Post published' });
  });

  it('uses provided publishedAt value', async () => {
    (nowIso as jest.Mock).mockReturnValue('ignored');
    repoPublishPost.mockResolvedValue(undefined);

    const fd = new FormData();
    fd.set('publishedAt', '2023-05-01');

    await publishPost('shop', '1', fd);

    expect(nowIso).not.toHaveBeenCalled();
    expect(repoPublishPost).toHaveBeenCalledWith(
      {},
      '1',
      new Date('2023-05-01').toISOString(),
    );
  });

  it('logs error when repository fails', async () => {
    const error = new Error('fail');
    repoPublishPost.mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = await publishPost('shop', '1');

    expect(consoleError).toHaveBeenCalledWith('Failed to publish post', error);
    expect(result).toEqual({ error: 'Failed to publish post' });

    consoleError.mockRestore();
  });
});

