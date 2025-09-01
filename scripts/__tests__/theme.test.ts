/** @jest-environment node */
import { expect } from "@jest/globals";

jest.mock("@acme/platform-core/createShop", () => ({
  loadBaseTokens: jest.fn(),
}));

jest.mock("../src/generate-theme.ts", () => ({
  generateThemeTokens: jest.fn(),
}));

jest.mock("../src/utils/prompt.ts", () => ({
  prompt: jest.fn(),
}));

const loadBaseTokens = require("@acme/platform-core/createShop").loadBaseTokens as jest.Mock;
const generateThemeTokens = require("../src/generate-theme.ts").generateThemeTokens as jest.Mock;
const prompt = require("../src/utils/prompt.ts").prompt as jest.Mock;

const ORIGINAL_ARGV = process.argv;

describe("promptThemeOverrides", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.argv = ORIGINAL_ARGV;
  });

  it("uses CLI flags to derive overrides", async () => {
    process.argv = ["node", "script", "--brand", "#123456"];
    loadBaseTokens.mockReturnValue({
      "--color-primary": "0 0% 0%",
      "--other": "x",
    });
    generateThemeTokens.mockReturnValue({
      "--color-primary": "240 100% 50%",
      "--other": "x",
    });

    const { promptThemeOverrides } = await import("../src/utils/theme.ts");
    const overrides = await promptThemeOverrides();

    expect(overrides).toEqual({ "--color-primary": "240 100% 50%" });
    expect(prompt).not.toHaveBeenCalled();
  });

  it("prompts for brand and token overrides interactively", async () => {
    process.argv = ["node", "script"]; // no flags
    loadBaseTokens.mockReturnValue({
      "--color-primary": "0 0% 0%",
      foo: "bar",
    });
    generateThemeTokens.mockReturnValue({
      "--color-primary": "60 50% 50%",
      foo: "bar",
    });
    prompt
      .mockResolvedValueOnce("#abcdef")
      .mockResolvedValueOnce("baz=qux")
      .mockResolvedValueOnce("");

    const { promptThemeOverrides } = await import("../src/utils/theme.ts");
    const overrides = await promptThemeOverrides();

    expect(overrides).toEqual({
      "--color-primary": "60 50% 50%",
      baz: "qux",
    });
    expect(generateThemeTokens).toHaveBeenCalledWith("#abcdef");
  });
});

