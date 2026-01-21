import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as path from "path";

jest.mock("path", () => ({
  join: jest.fn((...parts: string[]) => parts.join("/")),
  dirname: jest.fn((p: string) => p.split("/").slice(0, -1).join("/")),
}));

const product = { id: "123", title: "Title", description: "Desc" };
const writeMock = jest.fn();
const mkdirMock = jest.fn();
const fetchMock = jest.fn();
(global as any).fetch = fetchMock;

jest.mock("fs", () => ({
  promises: {
    mkdir: mkdirMock,
    writeFile: writeMock,
  },
}));

describe("generateMeta", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    delete (global as any).__OPENAI_IMPORT_ERROR__;
    expect(fetchMock).not.toHaveBeenCalled();
    writeMock.mockReset();
    mkdirMock.mockReset();
    fetchMock.mockReset();
    (path.join as jest.Mock).mockClear();
    (path.dirname as jest.Mock).mockClear();
    jest.resetModules();
  });

  it("falls back when OpenAI returns invalid JSON", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const responsesCreate = jest.fn<any, any[]>().mockResolvedValue({
      output: [{ content: [{ text: "notjson" }] }],
    });
    const imagesGenerate = jest.fn<any, any[]>().mockResolvedValue({
      data: [{ b64_json: "" }],
    });
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
      const file = path.join(process.cwd(), "public", "og", `${product.id}.png`);
      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
      expect(responsesCreate).toHaveBeenCalled();
      expect(imagesGenerate).toHaveBeenCalled();
      expect(mkdirMock).toHaveBeenCalledWith(path.dirname(file), {
        recursive: true,
      });
      expect(writeMock).toHaveBeenCalledWith(file, Buffer.from(""));
    });
  });
});
