import * as path from 'node:path';

describe('@acme/editorial', () => {
  beforeAll(() => {
    const repoRoot = path.resolve(process.cwd(), '../../..');
    process.env.DATA_ROOT = path.join(repoRoot, 'data', 'shops');
  });

  it('lists posts from data/shops/demo/blog', async () => {
    const repoRoot = path.resolve(process.cwd(), '../../..');
    jest.resetModules();
    jest.doMock('@platform-core/dataRoot', () => ({
      DATA_ROOT: path.join(repoRoot, 'data', 'shops'),
    }), { virtual: true });
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const core = require('@platform-core/dataRoot');
    expect(core.DATA_ROOT.endsWith(path.join('data','shops'))).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const editorial = require('../src/index');
    const posts = await editorial.fetchPublishedPosts('demo');
    expect(Array.isArray(posts)).toBe(true);
    const slugs = posts.map(p => p.slug);
    expect(slugs).toContain('hello-world');
  });

  it('fetches a post by slug and returns body', async () => {
    const repoRoot = path.resolve(process.cwd(), '../../..');
    jest.resetModules();
    jest.doMock('@platform-core/dataRoot', () => ({
      DATA_ROOT: path.join(repoRoot, 'data', 'shops'),
    }), { virtual: true });
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const editorial = require('../src/index');
    const post = await editorial.fetchPostBySlug('demo', 'hello-world');
    expect(post?.title).toMatch(/hello world/i);
    expect(typeof post?.body).toBe('string');
    expect(post?.body).toMatch(/Hello World/);
  });
});
