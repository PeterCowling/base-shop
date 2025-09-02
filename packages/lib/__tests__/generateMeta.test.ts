import path from "path";
import { promises as fs } from "fs";

const configEnv = { OPENAI_API_KEY: "key" } as { OPENAI_API_KEY: string | undefined };
jest.mock("@acme/config", () => ({
  env: configEnv,
}));

const responsesCreateMock = jest.fn().mockResolvedValue({
  output: [{ content: [{ text: '{"title":"T","description":"D","alt":"A"}' }] }],
});
const imagesGenerateMock = jest.fn().mockResolvedValue({
  data: [{ b64_json: Buffer.from("img").toString("base64") }],
});
const OpenAIConstructorMock = jest.fn().mockImplementation(() => ({
  responses: { create: responsesCreateMock },
  images: { generate: imagesGenerateMock },
}));
jest.mock("openai", () => ({
  __esModule: true,
  default: OpenAIConstructorMock,
}));

jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

let generateMeta: typeof import("../src/generateMeta").generateMeta;
beforeAll(async () => {
  ({ generateMeta } = await import("../src/generateMeta"));
});

describe("generateMeta", () => {
  const writeFileMock = fs.writeFile as jest.Mock;
  const mkdirMock = fs.mkdir as jest.Mock;

  afterEach(() => {
    writeFileMock.mockReset();
    mkdirMock.mockReset();
    responsesCreateMock.mockClear();
    imagesGenerateMock.mockClear();
    OpenAIConstructorMock.mockClear();
    delete (global as any).__OPENAI_IMPORT_ERROR__;
  });

  it("generates metadata and image using OpenAI", async () => {
    configEnv.OPENAI_API_KEY = "key";

    const result = await generateMeta({
      id: "123",
      title: "Title",
      description: "Desc",
    });

    const dir = path.join(process.cwd(), "public", "og");
    const file = path.join(dir, "123.png");

    expect(responsesCreateMock).toHaveBeenCalled();
    expect(imagesGenerateMock).toHaveBeenCalled();

    expect(mkdirMock).toHaveBeenCalledWith(dir, { recursive: true });
    expect(writeFileMock).toHaveBeenCalledWith(file, Buffer.from("img"));

    expect(result).toEqual({
      title: "T",
      description: "D",
      alt: "A",
      image: "/og/123.png",
    });
  });

  it("falls back to defaults when OpenAI returns malformed JSON", async () => {
    responsesCreateMock.mockResolvedValueOnce({
      output: [{ content: [{ text: "not json" }] }],
    });

    const result = await generateMeta({
      id: "123",
      title: "Title",
      description: "Desc",
    });

    const dir = path.join(process.cwd(), "public", "og");
    const file = path.join(dir, "123.png");

    expect(result).toEqual({
      title: "Title",
      description: "Desc",
      alt: "Title",
      image: "/og/123.png",
    });

    expect(mkdirMock).toHaveBeenCalledWith(dir, { recursive: true });
    expect(writeFileMock).toHaveBeenCalledWith(file, Buffer.from("img"));
  });

  it("returns fallback metadata when OpenAI import fails", async () => {
    jest.resetModules();
    jest.doMock("openai", () => {
      throw new Error("fail");
    });

    const { generateMeta: gm } = await import("../src/generateMeta");
    const { promises: fsDynamic } = await import("fs");
    const writeMock = fsDynamic.writeFile as jest.Mock;
    const mkdirMockDynamic = fsDynamic.mkdir as jest.Mock;
    const result = await gm({
      id: "123",
      title: "Title",
      description: "Desc",
    });

    expect(result).toEqual({
      title: "Title",
      description: "Desc",
      alt: "Title",
      image: "/og/123.png",
    });

    expect(responsesCreateMock).not.toHaveBeenCalled();
    expect(imagesGenerateMock).not.toHaveBeenCalled();
    expect(mkdirMockDynamic).not.toHaveBeenCalled();
    expect(writeMock).not.toHaveBeenCalled();

    jest.resetModules();
  });

  it("returns fallback metadata when OpenAI default export is not a constructor", async () => {
    jest.resetModules();
    jest.doMock("openai", () => ({
      __esModule: true,
      default: {},
    }));

    const { generateMeta: gm } = await import("../src/generateMeta");
    const { promises: fsDynamic } = await import("fs");
    const writeMock = fsDynamic.writeFile as jest.Mock;
    const mkdirMockDynamic = fsDynamic.mkdir as jest.Mock;

    const result = await gm({
      id: "123",
      title: "Title",
      description: "Desc",
    });

    expect(result).toEqual({
      title: "Title",
      description: "Desc",
      alt: "Title",
      image: "/og/123.png",
    });

    expect(responsesCreateMock).not.toHaveBeenCalled();
    expect(imagesGenerateMock).not.toHaveBeenCalled();
    expect(mkdirMockDynamic).not.toHaveBeenCalled();
    expect(writeMock).not.toHaveBeenCalled();

    jest.resetModules();
  });

  it("returns fallback when __OPENAI_IMPORT_ERROR__ is set", async () => {
    (global as any).__OPENAI_IMPORT_ERROR__ = new Error("fail");
    const result = await generateMeta({
      id: "123",
      title: "Title",
      description: "Desc",
    });
    expect(result).toEqual({
      title: "Title",
      description: "Desc",
      alt: "Title",
      image: "/og/123.png",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
    expect(imagesGenerateMock).not.toHaveBeenCalled();
  });

  it("returns fallback metadata when no API key in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    configEnv.OPENAI_API_KEY = undefined;

    try {
      const result = await generateMeta({
        id: "123",
        title: "Title",
        description: "Desc",
      });

      expect(result).toEqual({
        title: "Title",
        description: "Desc",
        alt: "Title",
        image: "/og/123.png",
      });

      expect(mkdirMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalEnv;
      configEnv.OPENAI_API_KEY = "key";
    }
  });

  it("returns deterministic metadata in tests without API key", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    configEnv.OPENAI_API_KEY = undefined;

    try {
      const result = await generateMeta({
        id: "123",
        title: "Title",
        description: "Desc",
      });

      expect(result).toEqual({
        title: "AI title",
        description: "AI description",
        alt: "alt",
        image: "/og/123.png",
      });

      expect(mkdirMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalEnv;
      configEnv.OPENAI_API_KEY = "key";
    }
  });
});

