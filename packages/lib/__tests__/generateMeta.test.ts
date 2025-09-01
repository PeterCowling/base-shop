import path from "path";
import { promises as fs } from "fs";

jest.mock("@acme/config", () => ({
  env: { OPENAI_API_KEY: "test-key" },
}));

jest.mock("openai", () => {
  class OpenAI {
    responses = {
      create: jest.fn().mockResolvedValue({
        output: [
          { content: [{ text: '{"title":"T","description":"D","alt":"A"}' }] },
        ],
      }),
    };
    images = {
      generate: jest.fn().mockResolvedValue({
        data: [{ b64_json: Buffer.from("img").toString("base64") }],
      }),
    };
  }
  return { default: OpenAI };
});

jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

import { generateMeta } from "../src/generateMeta";

describe("generateMeta", () => {
  const writeFileMock = fs.writeFile as jest.Mock;
  const mkdirMock = fs.mkdir as jest.Mock;

  afterEach(() => {
    writeFileMock.mockReset();
    mkdirMock.mockReset();
  });

  it("generates metadata using OpenAI and writes image", async () => {
    const result = await generateMeta({
      id: "123",
      title: "Title",
      description: "Desc",
    });

    expect(result).toEqual({
      title: "T",
      description: "D",
      alt: "A",
      image: "/og/123.png",
    });

    const filePath = path.join(process.cwd(), "public", "og", "123.png");
    expect(mkdirMock).toHaveBeenCalledWith(path.dirname(filePath), {
      recursive: true,
    });
    expect(writeFileMock).toHaveBeenCalledWith(filePath, Buffer.from("img"));
  });
});

