import { jest } from '@jest/globals';

const product = { id: '123', title: 'Title', description: 'Desc' };

describe('generateMeta', () => {
  afterEach(() => {
    delete (globalThis as any).__OPENAI_IMPORT_ERROR__;
    delete process.env.NODE_ENV;
    jest.resetModules();
  });

  it('returns fallback metadata when API key is missing', async () => {
    let result;
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = 'development';
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: {} }));
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('returns deterministic AI data in test env without key', async () => {
    let result;
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = 'test';
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: {} }));
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: 'AI title',
      description: 'AI description',
      alt: 'alt',
      image: '/og/123.png',
    });
  });

  it('uses OpenAI data when import succeeds', async () => {
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [
        {
          content: [
            { text: JSON.stringify({ title: 'LLM Title', description: 'LLM Desc', alt: 'LLM Alt' }) },
          ],
        },
      ],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    const writeFile = jest.fn();

    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile, mkdir: jest.fn() } }));
      jest.doMock(
        'openai',
        () => ({
          __esModule: true,
          default: jest.fn().mockImplementation(() => ({
            responses: { create: responsesCreate },
            images: { generate: imagesGenerate },
          })),
        }),
        { virtual: true },
      );
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(responsesCreate).toHaveBeenCalled();
    expect(imagesGenerate).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(result).toEqual({
      title: 'LLM Title',
      description: 'LLM Desc',
      alt: 'LLM Alt',
      image: '/og/123.png',
    });
  });

  it('parses metadata when content is a raw string', async () => {
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [JSON.stringify({ title: 'T', description: 'D', alt: 'A' })] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });

    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock(
        'openai',
        () => ({
          __esModule: true,
          default: jest.fn().mockImplementation(() => ({
            responses: { create: responsesCreate },
            images: { generate: imagesGenerate },
          })),
        }),
        { virtual: true },
      );
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: 'T',
      description: 'D',
      alt: 'A',
      image: '/og/123.png',
    });
  });

  it('fills missing metadata fields with product defaults', async () => {
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: JSON.stringify({ title: 'T' }) }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });

    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock(
        'openai',
        () => ({
          __esModule: true,
          default: jest.fn().mockImplementation(() => ({
            responses: { create: responsesCreate },
            images: { generate: imagesGenerate },
          })),
        }),
        { virtual: true },
      );
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: 'T',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('returns product metadata when OpenAI yields empty object', async () => {
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: '{}' }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });

    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock(
        'openai',
        () => ({
          __esModule: true,
          default: jest.fn().mockImplementation(() => ({
            responses: { create: responsesCreate },
            images: { generate: imagesGenerate },
          })),
        }),
        { virtual: true },
      );
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('returns fallback when __OPENAI_IMPORT_ERROR__ is set', async () => {
    const OpenAI = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      (globalThis as any).__OPENAI_IMPORT_ERROR__ = true;
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('openai', () => ({ __esModule: true, default: OpenAI }), { virtual: true });
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(OpenAI).not.toHaveBeenCalled();
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('returns fallback when openai import throws', async () => {
    const writeFile = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile, mkdir: jest.fn() } }));
      jest.doMock('openai', () => {
        throw new Error('fail');
      }, { virtual: true });
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(writeFile).not.toHaveBeenCalled();
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('returns fallback when OpenAI default export is not a constructor', async () => {
    const writeFile = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile, mkdir: jest.fn() } }));
      jest.doMock('openai', () => ({ __esModule: true, default: {} }), { virtual: true });
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(writeFile).not.toHaveBeenCalled();
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('ignores invalid JSON from OpenAI', async () => {
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: 'not json' }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock(
        'openai',
        () => ({
          __esModule: true,
          default: jest.fn().mockImplementation(() => ({
            responses: { create: responsesCreate },
            images: { generate: imagesGenerate },
          })),
        }),
        { virtual: true },
      );
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });
});

