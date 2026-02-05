/** @jest-environment node */
import { PassThrough, Writable } from "node:stream";

import { expect } from "@jest/globals";

class MockWritable extends Writable {
  data: string[] = [];
  _write(chunk: any, _encoding: string, cb: (error?: Error | null) => void) {
    this.data.push(chunk.toString());
    cb();
  }
}

let stdinMock: PassThrough;
let stdoutMock: MockWritable;

jest.mock("node:process", () => ({
  get stdin() {
    return stdinMock;
  },
  get stdout() {
    return stdoutMock;
  },
}));

async function loadPromptModule() {
  jest.resetModules();
  stdinMock = new PassThrough();
  stdoutMock = new MockWritable();
  return await import("../src/utils/prompts.ts");
}

function feed(lines: string[]) {
  const stream = stdinMock;
  lines.forEach((line, idx) => {
    setTimeout(() => stream.write(line + "\n"), idx * 10);
  });
  setTimeout(() => stream.end(), lines.length * 10);
}

describe("prompt utilities", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.skip("reads user input", async () => {
    const { prompt } = await loadPromptModule();
    const p = prompt("Question: ");
    feed(["answer"]);
    await expect(p).resolves.toBe("answer");
  });

  it("uses default when input empty", async () => {
    const { prompt } = await loadPromptModule();
    const p = prompt("Question: ", "def");
    feed([""]);
    await expect(p).resolves.toBe("def");
  });

  it("selects providers by number", async () => {
    const { selectProviders } = await loadPromptModule();
    const p = selectProviders("providers", ["A", "B", "C"]);
    feed(["1,3"]);
    const result = await p;
    expect(result).toEqual(["A", "C"]);
  });

  it("selects option with validation", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { selectOption } = await loadPromptModule();
    const p = selectOption("option", ["A", "B"], 0);
    feed(["5", "2"]);
    const result = await p;
    expect(result).toBe("B");
    expect(errorSpy).toHaveBeenCalledWith("Invalid option selection.");
  });

  it("validates URL input", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { promptUrl } = await loadPromptModule();
    const p = promptUrl("URL: ");
    feed(["bad", "https://example.com"]);
    const result = await p;
    expect(result).toBe("https://example.com");
    expect(errorSpy).toHaveBeenCalledWith("Invalid URL.");
  });

  it("returns undefined for empty URL", async () => {
    const { promptUrl } = await loadPromptModule();
    const p = promptUrl("URL: ");
    feed([""]);
    const result = await p;
    expect(result).toBeUndefined();
  });

  it("validates email input", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { promptEmail } = await loadPromptModule();
    const p = promptEmail("Email: ");
    feed(["bad", "user@example.com"]);
    const result = await p;
    expect(result).toBe("user@example.com");
    expect(errorSpy).toHaveBeenCalledWith("Invalid email address.");
  });

  it("collects navigation items", async () => {
    const { promptNavItems } = await loadPromptModule();
    const p = promptNavItems();
    feed(["Home", "/", "About", "/about", ""]);
    const result = await p;
    expect(result).toEqual([
      { label: "Home", url: "/" },
      { label: "About", url: "/about" },
    ]);
  });

  it("collects pages", async () => {
    const { promptPages } = await loadPromptModule();
    const p = promptPages();
    feed(["about", "About Us", "contact", "Contact", ""]);
    const result = await p;
    expect(result).toEqual([
      { slug: "about", title: { en: "About Us" }, components: [], status: "draft", visibility: "public" },
      { slug: "contact", title: { en: "Contact" }, components: [], status: "draft", visibility: "public" },
    ]);
  });
});
