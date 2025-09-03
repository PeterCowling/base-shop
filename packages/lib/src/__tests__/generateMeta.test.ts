// @ts-nocheck
import path from "path";

describe("generateMeta", () => {
  const product = { id: "123", title: "Title", description: "Desc" };

  it("returns deterministic metadata in test env without API key", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: undefined } as { OPENAI_API_KEY: string | undefined };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => { throw new Error("should not import"); }, { virtual: true });
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
      process.env.NODE_ENV = originalEnv;
    });
    expect(result).toEqual({
      title: "AI title",
      description: "AI description",
      alt: "alt",
      image: `/og/${product.id}.png`,
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("returns raw metadata when no API key outside tests", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: undefined } as { OPENAI_API_KEY: string | undefined };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => { throw new Error("should not import"); }, { virtual: true });
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
      process.env.NODE_ENV = originalEnv;
    });
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("falls back when __OPENAI_IMPORT_ERROR__ is set", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      (globalThis as any).__OPENAI_IMPORT_ERROR__ = true;
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
      delete (globalThis as any).__OPENAI_IMPORT_ERROR__;
    });
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("returns fallback when OpenAI import throws", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => { throw new Error("boom"); }, { virtual: true });
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("returns fallback when OpenAI export is not a constructor", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => ({ __esModule: true, default: {} }), { virtual: true });
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
    expect(writeMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
  });

  it("falls back with named OpenAI export function", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: "not json" }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("img").toString("base64") }],
    });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => ({ __esModule: true, OpenAI }), { virtual: true });
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
  });

  it("falls back with nested default.default export function", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: "not json" }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("img").toString("base64") }],
    });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock(
        "openai",
        () => ({ __esModule: true, default: { default: OpenAI } }),
        { virtual: true },
      );
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
  });

  it("falls back when module exports a function", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: "not json" }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("img").toString("base64") }],
    });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => OpenAI, { virtual: true });
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
  });

  it("generates metadata and image with OpenAI", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [
        { content: [{ text: '{"title":"T","description":"D","alt":"A"}' }] },
      ],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("img").toString("base64") }],
    });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => ({ __esModule: true, default: OpenAI }), { virtual: true });
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    const file = path.join(process.cwd(), "public", "og", `${product.id}.png`);
    expect(responsesCreate).toHaveBeenCalled();
    expect(imagesGenerate).toHaveBeenCalled();
    expect(mkdirMock).toHaveBeenCalledWith(path.dirname(file), { recursive: true });
    expect(writeMock).toHaveBeenCalledWith(file, Buffer.from("img"));
    expect(result).toEqual({
      title: "T",
      description: "D",
      alt: "A",
      image: `/og/${product.id}.png`,
    });
  });

  it("falls back when OpenAI returns invalid JSON", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [{ content: [{ text: "not json" }] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("img").toString("base64") }],
    });
    const OpenAI = jest.fn().mockImplementation(() => ({
      responses: { create: responsesCreate },
      images: { generate: imagesGenerate },
    }));
    let result;
    await jest.isolateModulesAsync(async () => {
      const envMock = { OPENAI_API_KEY: "key" };
      jest.doMock("@acme/config", () => ({ env: envMock }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => ({ __esModule: true, default: OpenAI }), { virtual: true });
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    const file = path.join(process.cwd(), "public", "og", `${product.id}.png`);
    expect(result).toEqual({
      title: product.title,
      description: product.description,
      alt: product.title,
      image: `/og/${product.id}.png`,
    });
    expect(mkdirMock).toHaveBeenCalledWith(path.dirname(file), { recursive: true });
    expect(writeMock).toHaveBeenCalledWith(file, Buffer.from("img"));
  });
});

