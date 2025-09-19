/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe("requireEnv", () => {
  const getRequire = async () =>
    (await import("../../core.ts")).requireEnv as any;

  it("returns value for existing variables", async () => {
    process.env.REQ = "present";
    const requireEnv = await getRequire();
    expect(requireEnv("REQ")).toBe("present");
  });

  it("throws when variable is missing", async () => {
    const requireEnv = await getRequire();
    expect(() => requireEnv("MISSING")).toThrow();
  });

  it("throws on empty value", async () => {
    process.env.EMPTY = "";
    const requireEnv = await getRequire();
    expect(() => requireEnv("EMPTY")).toThrow();
  });

  it("throws on whitespace-only value", async () => {
    process.env.SPACE = "   ";
    const requireEnv = await getRequire();
    expect(() => requireEnv("SPACE")).toThrow();
  });

  it("trims surrounding whitespace", async () => {
    process.env.TRIM = "  value  ";
    const requireEnv = await getRequire();
    expect(requireEnv("TRIM")).toBe("value");
  });
});

describe("requireEnv boolean parsing", () => {
  const getRequire = async () =>
    (await import("../../core.ts")).requireEnv as any;
  const cases: Array<[string, boolean]> = [
    ["true", true],
    [" false ", false],
    ["1", true],
    ["0", false],
    ["TRUE", true],
    ["FaLsE", false],
  ];

  it.each(cases)("parses boolean %s", async (input, expected) => {
    process.env.BOOL = input;
    const requireEnv = await getRequire();
    expect(requireEnv("BOOL", "boolean")).toBe(expected);
  });

  it.each(["yes", "no"])("rejects boolean %s", async (input) => {
    process.env.BOOL = input;
    const requireEnv = await getRequire();
    expect(() => requireEnv("BOOL", "boolean")).toThrow();
  });
});

describe("requireEnv number parsing", () => {
  const getRequire = async () =>
    (await import("../../core.ts")).requireEnv as any;

  const valid: Array<[string, number]> = [
    ["1", 1],
    ["-2", -2],
    ["3.14", 3.14],
    [" 4 ", 4],
  ];

  it.each(valid)("parses number %s", async (input, expected) => {
    process.env.NUM = input;
    const requireEnv = await getRequire();
    expect(requireEnv("NUM", "number")).toBe(expected);
  });

  it.each(["NaN", "not-a-number"])(
    "rejects invalid number %s",
    async (input) => {
      process.env.NUM = input;
      const requireEnv = await getRequire();
      expect(() => requireEnv("NUM", "number")).toThrow();
    },
  );
});
