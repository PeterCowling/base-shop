import { describe, it, expect, afterEach, jest } from "@jest/globals";
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

  it("falls back when import error flag is set", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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

  it("falls back when OpenAI import throws", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
});
