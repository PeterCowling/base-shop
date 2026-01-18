import { describe, it, afterEach, expect, jest } from "@jest/globals";

jest.mock("path", () => ({
  join: jest.fn((...parts: string[]) => parts.join("/")),
  dirname: jest.fn((p: string) => p.split("/").slice(0, -1).join("/")),
}));

import * as path from "path";

const product = { id: "edge", title: "Edge", description: "Case" };
const writeMock = jest.fn();
const mkdirMock = jest.fn();
const fetchMock = jest.fn();

(global as { fetch: typeof fetch }).fetch = fetchMock;

jest.mock("fs", () => ({
  promises: {
    mkdir: mkdirMock,
    writeFile: writeMock,
  },
}));

describe("generateMeta edge cases", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    writeMock.mockReset();
    mkdirMock.mockReset();
    fetchMock.mockReset();
    (path.join as jest.Mock).mockClear();
    (path.dirname as jest.Mock).mockClear();
    jest.resetModules();
  });

  it("handles responses that omit content entries", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const responsesCreate = jest.fn().mockResolvedValue({ output: [] });
    const imagesGenerate = jest.fn().mockResolvedValue({ data: [{ b64_json: "" }] });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));

    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock("openai", () => ({ __esModule: true, default: OpenAI }), {
        virtual: true,
      });
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);

      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
      expect(responsesCreate).toHaveBeenCalledTimes(1);
      expect(imagesGenerate).toHaveBeenCalledTimes(1);
    });
  });

  it("ignores non-string content payloads", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [
        {
          content: [
            {
              text: { title: "Ignored" },
            },
          ],
        },
      ],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({ data: [{ b64_json: "" }] });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));

    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock("openai", () => ({ __esModule: true, default: OpenAI }), {
        virtual: true,
      });
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);

      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
      expect(responsesCreate).toHaveBeenCalledTimes(1);
      expect(imagesGenerate).toHaveBeenCalledTimes(1);
    });
  });
});

