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

  it("returns fallback metadata when no API key in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

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
    }
  });
});

