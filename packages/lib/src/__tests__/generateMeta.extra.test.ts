import { jest } from '@jest/globals';

const baseProduct = { id: '1', title: 'Title', description: 'Desc' };

describe('generateMeta', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
  });

  it('produces basic meta tags', async () => {
    let meta;
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = 'test';
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: {} }));
      const { generateMeta } = await import('./generateMeta');
      meta = await generateMeta(baseProduct);
    });
    expect(meta).toEqual({
      title: 'AI title',
      description: 'AI description',
      alt: 'alt',
      image: '/og/1.png',
    });
  });

  it('handles missing inputs gracefully', async () => {
    let meta;
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = 'test';
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: {} }));
      const { generateMeta } = await import('./generateMeta');
      meta = await generateMeta({ id: '1' } as any);
    });
    expect(meta).toEqual({
      title: 'AI title',
      description: 'AI description',
      alt: 'alt',
      image: '/og/1.png',
    });
  });

  it('merges custom tags', async () => {
    let merged;
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = 'test';
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: {} }));
      const { generateMeta } = await import('./generateMeta');
      const meta = await generateMeta(baseProduct);
      const custom = { keywords: 'foo,bar', description: 'Custom description' };
      merged = { ...meta, ...custom };
    });
    expect(merged).toEqual({
      title: 'AI title',
      description: 'Custom description',
      alt: 'alt',
      image: '/og/1.png',
      keywords: 'foo,bar',
    });
  });
});

