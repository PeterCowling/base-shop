import { promises as fs } from "fs";

jest.mock("@acme/config", () => ({
  env: { OPENAI_API_KEY: "test-key" },
}));

jest.mock("openai", () => {
  throw new Error("Failed to load OpenAI");
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

  it("returns fallback metadata when OpenAI import fails", async () => {
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
  });
});

