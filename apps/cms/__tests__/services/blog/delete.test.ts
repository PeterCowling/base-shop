/* eslint-env jest */

import { deletePost } from '../../../src/services/blog/posts/delete';

jest.mock('../../../src/actions/common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock('../../../src/services/blog/config', () => ({
  getConfig: jest.fn().mockResolvedValue({}),
}));

const repoDeletePost = jest.fn();

jest.mock('@acme/platform-core/repositories/blog.server', () => ({
  deletePost: (...args: unknown[]) => repoDeletePost(...args),
}));

describe('deletePost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resolves without error when repository succeeds', async () => {
    repoDeletePost.mockResolvedValue(undefined);
    const result = await deletePost('shop', '123');
    expect(result).toEqual({ message: 'Post deleted' });
    expect(repoDeletePost).toHaveBeenCalledWith({}, '123');
  });

  it('returns error when repository throws', async () => {
    repoDeletePost.mockRejectedValue(new Error('fail'));
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const result = await deletePost('shop', '123');
    expect(result).toEqual({ error: 'Failed to delete post' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to delete post',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});

