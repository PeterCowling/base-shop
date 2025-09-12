/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";
import { requireEnv } from "../core.js";

describe("core.requireEnv", () => {
  const ORIGINAL = process.env;
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it("parses booleans and numbers", () => {
    process.env.FLAG = "true";
    process.env.NUM = "42";
    expect(requireEnv("FLAG", "boolean")).toBe(true);
    expect(requireEnv("NUM", "number")).toBe(42);
  });

  it("errors for missing or blank values", () => {
    delete process.env.MISSING;
    expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
    process.env.BLANK = " ";
    expect(() => requireEnv("BLANK")).toThrow("BLANK is required");
  });

  it("errors for invalid boolean", () => {
    process.env.FLAG = "maybe";
    expect(() => requireEnv("FLAG", "boolean")).toThrow(
      "FLAG must be a boolean",
    );
  });

  it("errors for invalid number", () => {
    process.env.NUM = "abc";
    expect(() => requireEnv("NUM", "number")).toThrow(
      "NUM must be a number",
    );
  });
});
