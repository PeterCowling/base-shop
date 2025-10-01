import { describe, expect, it } from "@jest/globals";
import type { GeneratedMeta } from "../generateMeta";
import { resolveOpenAIConstructor } from "../generateMeta";

describe("resolveOpenAIConstructor", () => {
  it("prefers default export functions", () => {
    const fn = function defaultExport() {
      return {} as GeneratedMeta;
    };
    const result = resolveOpenAIConstructor({ default: fn });
    expect(result).toBe(fn);
  });

  it("supports named OpenAI exports", () => {
    const fn = function namedExport() {
      return {} as GeneratedMeta;
    };
    const result = resolveOpenAIConstructor({ OpenAI: fn });
    expect(result).toBe(fn);
  });

  it("handles nested default functions", () => {
    const fn = function nestedExport() {
      return {} as GeneratedMeta;
    };
    const result = resolveOpenAIConstructor({ default: { default: fn } });
    expect(result).toBe(fn);
  });

  it("returns function modules directly", () => {
    const ctor = resolveOpenAIConstructor(function OpenAI() {
      return {} as GeneratedMeta;
    });
    expect(typeof ctor).toBe("function");
  });

  it("returns undefined when no constructor is present", () => {
    expect(resolveOpenAIConstructor({})).toBeUndefined();
  });
});

