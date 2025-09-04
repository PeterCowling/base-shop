/* eslint-env jest */

import { getPost } from '../../../src/services/blog/posts/get';
import { ensureAuthorized } from '../../../src/actions/common/auth';

jest.mock('../../../src/actions/common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock('../../../src/services/blog/config', () => ({
  getConfig: jest.fn().mockResolvedValue({}),
}));

const repoGetPost = jest.fn();

jest.mock('@platform-core/repositories/blog.server', () => ({
  getPost: (...args: unknown[]) => repoGetPost(...args),
}));

describe('getPost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ensures authorization and calls repository', async () => {
    repoGetPost.mockResolvedValue({ id: '123' });
    const result = await getPost('shop', '123');
    expect(ensureAuthorized).toHaveBeenCalled();
    expect(repoGetPost).toHaveBeenCalledWith({}, '123');
    expect(result).toEqual({ id: '123' });
  });
});

