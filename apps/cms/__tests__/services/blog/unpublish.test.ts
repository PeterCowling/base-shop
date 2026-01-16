/* eslint-env jest */

import { unpublishPost } from '../../../src/services/blog/posts/unpublish';

jest.mock('../../../src/actions/common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock('../../../src/services/blog/config', () => ({
  getConfig: jest.fn().mockResolvedValue({}),
}));

const repoUnpublishPost = jest.fn();

jest.mock('@acme/platform-core/repositories/blog.server', () => ({
  unpublishPost: (...args: unknown[]) => repoUnpublishPost(...args),
}));

describe('unpublishPost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resolves without error when repository succeeds', async () => {
    repoUnpublishPost.mockResolvedValue(undefined);
    const result = await unpublishPost('shop', '123');
    expect(result).toEqual({ message: 'Post unpublished' });
    expect(repoUnpublishPost).toHaveBeenCalledWith({}, '123');
  });

  it('returns error when repository throws', async () => {
    repoUnpublishPost.mockRejectedValue(new Error('fail'));
    const result = await unpublishPost('shop', '123');
    expect(result).toEqual({ error: 'Failed to unpublish post' });
  });
});

