import * as path from 'node:path';

describe('@acme/editorial', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const dataRoot = path.join(repoRoot, 'data', 'shops');

  beforeAll(() => {
    process.env.DATA_ROOT = dataRoot;
  });

  it('lists posts from data/shops/demo/blog', async () => {
    jest.resetModules();
    jest.doMock('@acme/platform-core/dataRoot', () => ({
      DATA_ROOT: dataRoot,
    }), { virtual: true });
    const core = require('@acme/platform-core/dataRoot');
    expect(core.DATA_ROOT.endsWith(path.join('data','shops'))).toBe(true);
    const editorial = require('../src/index');
    const posts = await editorial.fetchPublishedPosts('demo');
    expect(Array.isArray(posts)).toBe(true);
    const slugs = posts.map((p: { slug: string }) => p.slug);
    expect(slugs).toContain('hello-world');
  });

  it('fetches a post by slug and returns body', async () => {
    jest.resetModules();
    jest.doMock('@acme/platform-core/dataRoot', () => ({
      DATA_ROOT: dataRoot,
    }), { virtual: true });
    const editorial = require('../src/index');
    const post = await editorial.fetchPostBySlug('demo', 'hello-world');
    expect(post?.title).toMatch(/hello world/i);
    expect(typeof post?.body).toBe('string');
    expect(post?.body).toMatch(/Hello World/);
  });
});
