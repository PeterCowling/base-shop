/* eslint-env jest */

import { ensureCanRead } from '../../../src/actions/common/auth';
import { getPost } from '../../../src/services/blog/posts/get';

jest.mock('../../../src/actions/common/auth', () => ({
  ensureCanRead: jest.fn(),
}));

jest.mock('../../../src/services/blog/config', () => ({
  getConfig: jest.fn().mockResolvedValue({}),
}));

const repoGetPost = jest.fn();

jest.mock('@acme/platform-core/repositories/blog.server', () => ({
  getPost: (...args: unknown[]) => repoGetPost(...args),
}));

describe('getPost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ensures authorization and calls repository', async () => {
    repoGetPost.mockResolvedValue({ id: '123' });
    const result = await getPost('shop', '123');
    expect(ensureCanRead).toHaveBeenCalled();
    expect(repoGetPost).toHaveBeenCalledWith({}, '123');
    expect(result).toEqual({ id: '123' });
  });
});
