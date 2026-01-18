import path from "path";

describe("generateMeta", () => {
  const product = { id: "id", title: "Title", description: "Desc" };

  afterEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
  });

  it("falls back to product data when API key is missing", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: { OPENAI_API_KEY: undefined },
      }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { generateMeta } = await import("@acme/lib/generateMeta");
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

  it("returns test metadata when NODE_ENV is test", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: { OPENAI_API_KEY: undefined },
      }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      (process.env as Record<string, string | undefined>).NODE_ENV = "test";
      const { generateMeta } = await import("@acme/lib/generateMeta");
      result = await generateMeta(product);
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

  it("falls back when import error flag is set", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: { OPENAI_API_KEY: "key" },
      }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      (globalThis as any).__OPENAI_IMPORT_ERROR__ = true;
      const { generateMeta } = await import("@acme/lib/generateMeta");
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

  it("falls back when dynamic import fails", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: { OPENAI_API_KEY: "key" },
      }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock(
        "openai",
        () => {
          throw new Error("boom");
        },
        { virtual: true }
      );
      const { generateMeta } = await import("@acme/lib/generateMeta");
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

  it("falls back when OpenAI export is not a constructor", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: { OPENAI_API_KEY: "key" },
      }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => ({ __esModule: true, default: {} }), { virtual: true });
      const { generateMeta } = await import("@acme/lib/generateMeta");
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

  it("generates metadata and image when OpenAI succeeds", async () => {
    const writeMock = jest.fn();
    const mkdirMock = jest.fn();
    const responsesCreate = jest.fn().mockResolvedValue({
      output: [
        { content: [JSON.stringify({ title: "T", description: "D", alt: "A" })] }],
    });
    const imagesGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: Buffer.from("fake").toString("base64") }],
    });
    class OpenAI {
      constructor() {
        this.responses = { create: responsesCreate };
        this.images = { generate: imagesGenerate };
      }
    }
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: { OPENAI_API_KEY: "key" },
      }));
      jest.doMock("fs", () => ({ promises: { writeFile: writeMock, mkdir: mkdirMock } }));
      jest.doMock("openai", () => ({ __esModule: true, default: OpenAI }), { virtual: true });
      const { generateMeta } = await import("@acme/lib/generateMeta");
      result = await generateMeta(product);
    });
    const file = path.join(process.cwd(), "public", "og", `${product.id}.png`);
    expect(result).toEqual({ title: "T", description: "D", alt: "A", image: `/og/${product.id}.png` });
    const call = responsesCreate.mock.calls[0][0];
    expect(call.model).toBe("gpt-4o-mini");
    expect(call.input).toContain(product.title);
    expect(call.input).toContain(product.description);
    expect(imagesGenerate).toHaveBeenCalledWith({
      model: "gpt-image-1",
      prompt: expect.stringContaining(product.title),
      size: "1024x1024",
    });
    expect(writeMock).toHaveBeenCalledWith(file, Buffer.from("fake"));
  });
});
