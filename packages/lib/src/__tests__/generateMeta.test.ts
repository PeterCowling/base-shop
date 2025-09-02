import path from "path";
import { promises as fs } from "fs";

const configEnv = { OPENAI_API_KEY: "key" } as { OPENAI_API_KEY: string | undefined };
jest.mock("@acme/config", () => ({
  env: configEnv,
}));

const responsesCreateMock = jest.fn();
const imagesGenerateMock = jest.fn();
const OpenAIConstructorMock = jest
  .fn()
  .mockImplementation(() => ({
    responses: { create: responsesCreateMock },
    images: { generate: imagesGenerateMock },
  }));

jest.mock("openai", () => {
  if ((global as any).__OPENAI_IMPORT_ERROR__) {
    throw (global as any).__OPENAI_IMPORT_ERROR__;
  }
  return { default: OpenAIConstructorMock };
});

jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

import { generateMeta } from "../generateMeta";

describe("generateMeta", () => {
  const writeFileMock = fs.writeFile as jest.Mock;
  const mkdirMock = fs.mkdir as jest.Mock;

  beforeEach(() => {
    (global as any).__OPENAI_IMPORT_ERROR__ = undefined;
    configEnv.OPENAI_API_KEY = "key";
    responsesCreateMock.mockReset();
    imagesGenerateMock.mockReset();
    OpenAIConstructorMock.mockClear();
    writeFileMock.mockReset();
    mkdirMock.mockReset();
  });

  it("parses JSON response and writes image", async () => {
    responsesCreateMock.mockResolvedValue({
      output: [{ content: [{ text: '{"title":"T","description":"D","alt":"A"}' }] }],
    });
    imagesGenerateMock.mockResolvedValue({
      data: [{ b64_json: Buffer.from("img").toString("base64") }],
    });

    const result = await generateMeta({
      id: "1",
      title: "Title",
      description: "Desc",
    });

    const dir = path.join(process.cwd(), "public", "og");
    const file = path.join(dir, "1.png");

    expect(responsesCreateMock).toHaveBeenCalled();
    expect(imagesGenerateMock).toHaveBeenCalled();

    expect(mkdirMock).toHaveBeenCalledWith(dir, { recursive: true });
    expect(writeFileMock).toHaveBeenCalledWith(file, Buffer.from("img"));

    expect(result).toEqual({
      title: "T",
      description: "D",
      alt: "A",
      image: "/og/1.png",
    });
  });

  it("falls back on malformed JSON", async () => {
    responsesCreateMock.mockResolvedValue({
      output: [{ content: [{ text: "not json" }] }],
    });
    imagesGenerateMock.mockResolvedValue({
      data: [{ b64_json: Buffer.from("img").toString("base64") }],
    });

    const result = await generateMeta({
      id: "2",
      title: "Title",
      description: "Desc",
    });

    const dir = path.join(process.cwd(), "public", "og");
    const file = path.join(dir, "2.png");

    expect(responsesCreateMock).toHaveBeenCalled();
    expect(imagesGenerateMock).toHaveBeenCalled();
    expect(mkdirMock).toHaveBeenCalledWith(dir, { recursive: true });
    expect(writeFileMock).toHaveBeenCalledWith(file, Buffer.from("img"));

    expect(result).toEqual({
      title: "Title",
      description: "Desc",
      alt: "Title",
      image: "/og/2.png",
    });
  });

  it("returns fallback when OpenAI import fails", async () => {
    (global as any).__OPENAI_IMPORT_ERROR__ = new Error("failed");

    const result = await generateMeta({
      id: "3",
      title: "Title",
      description: "Desc",
    });

    expect(result).toEqual({
      title: "Title",
      description: "Desc",
      alt: "Title",
      image: "/og/3.png",
    });

    expect(responsesCreateMock).not.toHaveBeenCalled();
    expect(imagesGenerateMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});

