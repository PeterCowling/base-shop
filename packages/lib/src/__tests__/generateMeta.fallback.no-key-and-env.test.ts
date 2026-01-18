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

  it("returns fallback meta without API key", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
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
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
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
});
