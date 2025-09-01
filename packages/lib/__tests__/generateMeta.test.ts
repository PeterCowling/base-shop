import { promises as fs } from "fs";

jest.mock("@acme/config", () => ({
  env: { OPENAI_API_KEY: undefined },
}));

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

  it("returns deterministic metadata and image path when no API key", async () => {
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
  });
});

