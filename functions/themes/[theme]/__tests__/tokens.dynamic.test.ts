import { onRequest } from "../tokens.dynamic.css.ts";
import fs from "node:fs/promises";

describe("tokens.dynamic.css onRequest", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets Cache-Control header", async () => {
    const next = jest.fn(async () => new Response(""));
    const req = new Request("https://example.com");
    const res = await onRequest({ request: req, next } as any);

    expect(next).toHaveBeenCalled();
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it("throws when token file is missing", async () => {
    jest.spyOn(fs, "readFile").mockRejectedValue(new Error("File not found"));
    const next = jest.fn(async () => {
      await fs.readFile("tokens.json", "utf8");
      return new Response("");
    });

    const req = new Request("https://example.com");
    await expect(onRequest({ request: req, next } as any)).rejects.toThrow(
      "File not found"
    );
    expect(next).toHaveBeenCalled();
  });

  it("throws on malformed token JSON", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("{");
    const next = jest.fn(async () => {
      const raw = await fs.readFile("tokens.json", "utf8");
      JSON.parse(raw);
      return new Response("");
    });

    const req = new Request("https://example.com");
    await expect(onRequest({ request: req, next } as any)).rejects.toThrow();
    expect(next).toHaveBeenCalled();
  });

  it("does not cache invalid results", async () => {
    const readFile = jest
      .spyOn(fs, "readFile")
      .mockRejectedValueOnce(new Error("File not found"))
      .mockResolvedValueOnce(JSON.stringify({ color: "blue" }));

    const next = jest.fn(async () => {
      const raw = await fs.readFile("tokens.json", "utf8");
      JSON.parse(raw);
      return new Response("");
    });

    const req = new Request("https://example.com");

    await expect(onRequest({ request: req, next } as any)).rejects.toThrow(
      "File not found"
    );
    expect(next).toHaveBeenCalledTimes(1);

    const res = await onRequest({ request: req, next } as any);

    expect(next).toHaveBeenCalledTimes(2);
    expect(readFile).toHaveBeenCalledTimes(2);
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    );
  });
});
