import { jest } from '@jest/globals';
import * as path from 'path';

const product = { id: '123', title: 'Title', description: 'Desc' };

describe('generateMeta', () => {
  it('returns metadata from OpenAI response when all fields present', async () => {
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [
        { content: [{ text: '{"title":"T","description":"D","alt":"A"}' }] },
      ],
    });
    const b64 = Buffer.from('img').toString('base64');
    const imagesGenerateMock = jest.fn().mockResolvedValue({
      data: [{ b64_json: b64 }],
    });
    const writeFileMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: writeFileMock, mkdir: jest.fn() } }));
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          responses: { create: responsesCreateMock },
          images: { generate: imagesGenerateMock },
        })),
      }), { virtual: true });
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    const expectedPath = path.join(process.cwd(), 'public', 'og', `${product.id}.png`);
    expect(writeFileMock).toHaveBeenCalledWith(expectedPath, Buffer.from(b64, 'base64'));
    expect(result).toEqual({
      title: 'T',
      description: 'D',
      alt: 'A',
      image: '/og/123.png',
    });
  });

  it('parses metadata when content is a raw string', async () => {
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [{ content: ['{"title":"T","description":"D","alt":"A"}'] }],
    });
    const imagesGenerateMock = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          responses: { create: responsesCreateMock },
          images: { generate: imagesGenerateMock },
        })),
      }), { virtual: true });
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
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: '{"title":"T"}' }] }],
    });
    const imagesGenerateMock = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          responses: { create: responsesCreateMock },
          images: { generate: imagesGenerateMock },
        })),
      }), { virtual: true });
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
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: '{}' }] }],
    });
    const imagesGenerateMock = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          responses: { create: responsesCreateMock },
          images: { generate: imagesGenerateMock },
        })),
      }), { virtual: true });
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

  it('returns AI placeholders when API key missing in test env', async () => {
    let result;
    const prev = process.env.NODE_ENV;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: {} }));
      process.env.NODE_ENV = 'test';
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    process.env.NODE_ENV = prev;
    expect(result).toEqual({
      title: 'AI title',
      description: 'AI description',
      alt: 'alt',
      image: '/og/123.png',
    });
  });

  it('falls back to product data when API key missing outside test', async () => {
    let result;
    const prev = process.env.NODE_ENV;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: {} }));
      process.env.NODE_ENV = 'development';
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    process.env.NODE_ENV = prev;
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('falls back when OpenAI import fails', async () => {
    const fsMocks = { promises: { writeFile: jest.fn(), mkdir: jest.fn() } };
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => fsMocks);
      jest.doMock('openai', () => {
        throw new Error('fail');
      }, { virtual: true });
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
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      (globalThis as any).__OPENAI_IMPORT_ERROR__ = true;
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
      delete (globalThis as any).__OPENAI_IMPORT_ERROR__;
    });
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('detects OpenAI constructor from named export', async () => {
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [
        {
          content: [
            JSON.stringify({
              title: 'LLM Title',
              description: 'LLM Desc',
              alt: 'LLM Alt',
            }),
          ],
        },
      ],
    });
    const imagesGenerateMock = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      const OpenAI = jest.fn().mockImplementation(() => ({
        responses: { create: responsesCreateMock },
        images: { generate: imagesGenerateMock },
      }));
      jest.doMock('openai', () => ({ __esModule: true, OpenAI }), { virtual: true });
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(responsesCreateMock).toHaveBeenCalled();
    expect(imagesGenerateMock).toHaveBeenCalled();
    expect(result).toEqual({
      title: 'LLM Title',
      description: 'LLM Desc',
      alt: 'LLM Alt',
      image: '/og/123.png',
    });
  });

  it('detects OpenAI constructor from nested default', async () => {
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [
        {
          content: [
            JSON.stringify({
              title: 'LLM Title',
              description: 'LLM Desc',
              alt: 'LLM Alt',
            }),
          ],
        },
      ],
    });
    const imagesGenerateMock = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      const OpenAI = jest.fn().mockImplementation(() => ({
        responses: { create: responsesCreateMock },
        images: { generate: imagesGenerateMock },
      }));
      jest.doMock(
        'openai',
        () => ({ __esModule: true, default: { default: OpenAI } }),
        { virtual: true },
      );
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(responsesCreateMock).toHaveBeenCalled();
    expect(imagesGenerateMock).toHaveBeenCalled();
    expect(result).toEqual({
      title: 'LLM Title',
      description: 'LLM Desc',
      alt: 'LLM Alt',
      image: '/og/123.png',
    });
  });

  it('falls back when OpenAI constructor missing', async () => {
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      jest.doMock('openai', () => ({ __esModule: true }), { virtual: true });
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

  it('ignores invalid JSON and keeps fallback metadata', async () => {
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: 'not json' }] }],
    });
    const b64 = Buffer.from('img').toString('base64');
    const imagesGenerateMock = jest.fn().mockResolvedValue({
      data: [{ b64_json: b64 }],
    });
    const writeFileMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@acme/config/env/core', () => ({ coreEnv: { OPENAI_API_KEY: 'key' } }));
      jest.doMock('fs', () => ({ promises: { writeFile: writeFileMock, mkdir: jest.fn() } }));
      jest.doMock('openai', () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
          responses: { create: responsesCreateMock },
          images: { generate: imagesGenerateMock },
        })),
      }), { virtual: true });
      const { generateMeta } = await import('../src/generateMeta');
      result = await generateMeta(product);
    });
    expect(writeFileMock).toHaveBeenCalled();
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });
});
