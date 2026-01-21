import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as path from "path";

jest.mock("path", () => ({
  join: jest.fn((...parts: string[]) => parts.join("/")),
  dirname: jest.fn((p: string) => p.split("/").slice(0, -1).join("/")),
}));

const product = { id: "abc-123", title: "Title", description: "Description" };
const writeMock = jest.fn();
const mkdirMock = jest.fn();
const fetchMock = jest.fn();

(global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

jest.mock("fs", () => ({
  promises: {
    mkdir: mkdirMock,
    writeFile: writeMock,
  },
}));

describe("generateMeta when OpenAI module is a function export", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    delete (globalThis as { __OPENAI_IMPORT_ERROR__?: boolean }).__OPENAI_IMPORT_ERROR__;
    writeMock.mockReset();
    mkdirMock.mockReset();
    fetchMock.mockReset();
    (path.join as jest.Mock).mockClear();
    (path.dirname as jest.Mock).mockClear();
    delete (globalThis as { __OPENAI_FUNCTION_EXPORT__?: unknown }).__OPENAI_FUNCTION_EXPORT__;
    jest.resetModules();
  });

  it("parses text content objects and writes empty image buffers", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const responsesCreate = jest.fn<any, any[]>().mockResolvedValue({
      output: [
        {
          content: [
            {
              text: JSON.stringify({
                description: "AI description",
              }),
            },
          ],
        },
      ],
    });
    const imagesGenerate = jest.fn<any, any[]>().mockResolvedValue({ data: [{}] });

    const OpenAIImpl = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));

    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      const actualTslib = jest.requireActual("tslib");
      jest.doMock(
        "tslib",
        () => ({
          ...(actualTslib as object),
          __importStar: (mod: unknown) => mod,
        }),
        { virtual: true },
      );
      (globalThis as { __OPENAI_FUNCTION_EXPORT__?: { impl?: (init: { apiKey: string }) => unknown } }).__OPENAI_FUNCTION_EXPORT__ =
        { impl: OpenAIImpl };
      jest.doMock("openai", () => require("./__fixtures__/openai-function.cjs"), {
        virtual: true,
      });

      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);

      expect(meta).toEqual({
        title: product.title,
        description: "AI description",
        alt: product.title,
        image: `/og/${product.id}.png`,
      });

      expect(OpenAIImpl).toHaveBeenCalledTimes(1);
      expect(responsesCreate).toHaveBeenCalledTimes(1);
      expect(imagesGenerate).toHaveBeenCalledTimes(1);

      const file = path.join(process.cwd(), "public", "og", `${product.id}.png`);
      expect(mkdirMock).toHaveBeenCalledWith(path.dirname(file), { recursive: true });
      expect(writeMock).toHaveBeenCalledWith(file, Buffer.from(""));
    });
  });
});

