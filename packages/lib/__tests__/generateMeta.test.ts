import { promises as fs } from 'fs';

// Mock configuration to provide an API key
jest.mock('@acme/config', () => ({ env: { OPENAI_API_KEY: 'key' } }));

// Mock filesystem interactions
jest.mock('fs', () => ({
  promises: { writeFile: jest.fn(), mkdir: jest.fn() },
}));

// Set up OpenAI client mocks
const responsesCreateMock = jest.fn();
const imagesGenerateMock = jest.fn();
const OpenAIConstructorMock = jest.fn().mockImplementation(() => ({
  responses: { create: responsesCreateMock },
  images: { generate: imagesGenerateMock },
}));

jest.mock('openai', () => ({ __esModule: true, default: OpenAIConstructorMock }));

const product = { id: '123', title: 'Title', description: 'Desc' };

beforeEach(() => {
  responsesCreateMock.mockReset();
  imagesGenerateMock.mockReset();
  (fs.writeFile as jest.Mock).mockReset();
  (fs.mkdir as jest.Mock).mockReset();
  jest.resetModules();
});

describe('generateMeta', () => {
  it('returns metadata from OpenAI response when all fields present', async () => {
    responsesCreateMock.mockResolvedValue({
      output: [{ content: [{ text: '{"title":"T","description":"D","alt":"A"}' }] }],
    });
    imagesGenerateMock.mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    const { generateMeta } = await import('../src/generateMeta');
    const result = await generateMeta(product);
    expect(result).toEqual({
      title: 'T',
      description: 'D',
      alt: 'A',
      image: '/og/123.png',
    });
  });

  it('fills missing metadata fields with product defaults', async () => {
    responsesCreateMock.mockResolvedValue({
      output: [{ content: [{ text: '{"title":"T"}' }] }],
    });
    imagesGenerateMock.mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    const { generateMeta } = await import('../src/generateMeta');
    const result = await generateMeta(product);
    expect(result).toEqual({
      title: 'T',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });

  it('returns product metadata when OpenAI yields empty object', async () => {
    responsesCreateMock.mockResolvedValue({
      output: [{ content: [{ text: '{}' }] }],
    });
    imagesGenerateMock.mockResolvedValue({
      data: [{ b64_json: Buffer.from('img').toString('base64') }],
    });
    const { generateMeta } = await import('../src/generateMeta');
    const result = await generateMeta(product);
    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      alt: 'Title',
      image: '/og/123.png',
    });
  });
});
