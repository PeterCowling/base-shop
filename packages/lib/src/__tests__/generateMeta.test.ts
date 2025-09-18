// @ts-nocheck
jest.mock("path", () => ({
  join: jest.fn((...parts) => parts.join("/")),
  dirname: jest.fn((p) => p.split("/").slice(0, -1).join("/")),
}));
import * as path from "path";

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
    process.env.NODE_ENV = originalEnv;
    delete (global as any).__OPENAI_IMPORT_ERROR__;
    expect(fetchMock).not.toHaveBeenCalled();
    writeMock.mockReset();
    mkdirMock.mockReset();
    fetchMock.mockReset();
    (path.join as jest.Mock).mockClear();
    (path.dirname as jest.Mock).mockClear();
    jest.resetModules();
  });

  it("returns fallback meta without API key", async () => {
    process.env.NODE_ENV = "production";
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: undefined };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock(
        "openai",
        () => {
          throw new Error("should not import");
        },
        { virtual: true },
      );
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("uses hard-coded meta in test environment", async () => {
    process.env.NODE_ENV = "test";
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: undefined };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock(
        "openai",
        () => {
          throw new Error("should not import");
        },
        { virtual: true },
      );
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(meta).toEqual({
        title: "AI title",
        description: "AI description",
        alt: "alt",
        image: `/og/${product.id}.png`,
      });
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("falls back when import error flag is set", async () => {
    process.env.NODE_ENV = "production";
    (global as any).__OPENAI_IMPORT_ERROR__ = true;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("generates metadata via OpenAI default export", async () => {
    process.env.NODE_ENV = "production";
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [
        {
          content: [
            JSON.stringify({
              title: "LLM Title",
              description: "LLM Desc",
              alt: "LLM Alt",
            }),
          ],
        },
      ],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("data").toString("base64") }],
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
        title: "LLM Title",
        description: "LLM Desc",
        alt: "LLM Alt",
        image: `/og/${product.id}.png`,
      });
      expect(responsesCreate).toHaveBeenCalled();
      expect(imagesGenerate).toHaveBeenCalled();
      expect(mkdirMock).toHaveBeenCalledWith(path.dirname(file), {
        recursive: true,
      });
      expect(writeMock).toHaveBeenCalledWith(file, Buffer.from("data"));
    });
  });

  it("falls back when OpenAI returns invalid JSON", async () => {
    process.env.NODE_ENV = "production";
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: "notjson" }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
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

  it("detects OpenAI constructor from named export", async () => {
    process.env.NODE_ENV = "production";
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [
        {
          content: [
            JSON.stringify({
              title: "LLM Title",
              description: "LLM Desc",
              alt: "LLM Alt",
            }),
          ],
        },
      ],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("data").toString("base64") }],
    });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock("openai", () => ({ __esModule: true, OpenAI }), {
        virtual: true,
      });
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(responsesCreate).toHaveBeenCalled();
      expect(imagesGenerate).toHaveBeenCalled();
      expect(meta).toEqual({
        title: "LLM Title",
        description: "LLM Desc",
        alt: "LLM Alt",
        image: `/og/${product.id}.png`,
      });
    });
  });

  it("detects OpenAI constructor from nested default", async () => {
    process.env.NODE_ENV = "production";
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [
        {
          content: [
            JSON.stringify({
              title: "LLM Title",
              description: "LLM Desc",
              alt: "LLM Alt",
            }),
          ],
        },
      ],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("data").toString("base64") }],
    });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock(
        "openai",
        () => ({ __esModule: true, default: { default: OpenAI } }),
        { virtual: true },
      );
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(responsesCreate).toHaveBeenCalled();
      expect(imagesGenerate).toHaveBeenCalled();
      expect(meta).toEqual({
        title: "LLM Title",
        description: "LLM Desc",
        alt: "LLM Alt",
        image: `/og/${product.id}.png`,
      });
    });
  });

  it("falls back when OpenAI import throws", async () => {
    process.env.NODE_ENV = "production";
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock(
        "openai",
        () => {
          throw new Error("import fail");
        },
        { virtual: true },
      );
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("falls back when OpenAI constructor missing", async () => {
    process.env.NODE_ENV = "production";
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock("openai", () => ({ __esModule: true }), { virtual: true });
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("falls back when default export is not a constructor", async () => {
    process.env.NODE_ENV = "production";
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock("openai", () => ({ __esModule: true, default: {} }), {
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
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("falls back when named OpenAI export is not a constructor", async () => {
    process.env.NODE_ENV = "production";
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock("openai", () => ({ __esModule: true, OpenAI: {} }), {
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
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("falls back when nested default export is not a constructor", async () => {
    process.env.NODE_ENV = "production";
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config/env/core", () => ({ coreEnv: envMock }));
      jest.doMock(
        "openai",
        () => ({ __esModule: true, default: { default: {} } }),
        { virtual: true },
      );
      const { generateMeta } = await import("../generateMeta");
      const meta = await generateMeta(product);
      expect(meta).toEqual({
        title: product.title,
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("overrides only provided fields from AI response", async () => {
    process.env.NODE_ENV = "production";
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [JSON.stringify({ title: "LLM Title" })] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("data").toString("base64") }],
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
      expect(meta).toEqual({
        title: "LLM Title",
        description: product.description,
        alt: product.title,
        image: `/og/${product.id}.png`,
      });
    });
  });
});
