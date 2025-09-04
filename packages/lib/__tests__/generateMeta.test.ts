import { jest } from '@jest/globals';

const product = { id: '123', title: 'Title', description: 'Desc' };

describe('generateMeta', () => {
  it('returns metadata from OpenAI response when all fields present', async () => {
    const responsesCreateMock = jest.fn().mockResolvedValue({
      output: [
        { content: [{ text: '{"title":"T","description":"D","alt":"A"}' }] },
      ],
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
});
