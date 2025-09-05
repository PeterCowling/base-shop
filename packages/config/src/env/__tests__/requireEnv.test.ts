/** @jest-environment node */
import { describe, it, expect, afterEach } from "@jest/globals";
import { requireEnv } from "../core.js";

describe("requireEnv", () => {
  const ORIGINAL_ENV = process.env;
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws when variable is undefined", () => {
    delete process.env.MISSING;
    expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
  });

  it("throws when variable is empty", () => {
    process.env.EMPTY = "   ";
    expect(() => requireEnv("EMPTY")).toThrow("EMPTY is required");
  });

  it.each([
    ["true", true],
    ["1", true],
    ["false", false],
    ["0", false],
  ])("parses boolean %s", (val, expected) => {
    process.env.FLAG = val as string;
    expect(requireEnv("FLAG", "boolean")).toBe(expected);
  });

  it("throws on invalid boolean", () => {
    process.env.FLAG = "maybe";
    expect(() => requireEnv("FLAG", "boolean")).toThrow(
      "FLAG must be a boolean",
    );
  });

  it("parses numbers", () => {
    process.env.NUM = "42";
    expect(requireEnv("NUM", "number")).toBe(42);
  });

  it("throws on invalid number", () => {
    process.env.NUM = "not-a-number";
    expect(() => requireEnv("NUM", "number")).toThrow(
      "NUM must be a number",
    );
  });

  it("returns trimmed string by default", () => {
    process.env.NAME = "  value  ";
    expect(requireEnv("NAME")).toBe("value");
  });
});
