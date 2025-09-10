import fs from "fs";
import { join } from "path";
import { parseToHsl } from "polished";
import {
  baseTokens,
  loadThemeTokensNode,
} from "@acme/platform-core/themeTokens";

describe("theme tokens API", () => {
  const rootDir = join(__dirname, "../../../../..");
  const themesDir = join(rootDir, "packages/themes");
  const partialDir = join(themesDir, "partial");
  const invalidDir = join(themesDir, "invalid");

  beforeAll(() => {
    fs.mkdirSync(partialDir, { recursive: true });
    fs.writeFileSync(
      join(partialDir, "tailwind-tokens.ts"),
      "export const tokens = { '--color-bg': '#000', '--space-1': '10px' } as const;",
    );
    fs.existsSync(join(partialDir, "tailwind-tokens.ts"));
    fs.mkdirSync(invalidDir, { recursive: true });
    fs.writeFileSync(
      join(invalidDir, "tailwind-tokens.ts"),
      "export const tokens = { '--color-bg': 'not-a-color' } as const;",
    );
    fs.existsSync(join(invalidDir, "tailwind-tokens.ts"));
  });

  afterAll(() => {
    fs.rmSync(partialDir, { recursive: true, force: true });
    fs.rmSync(invalidDir, { recursive: true, force: true });
  });

  it("merges overrides with base tokens", () => {
    const tokens = { ...baseTokens, ...loadThemeTokensNode("partial") };
    expect(tokens["--color-bg"]).toBe("#000");
    expect(tokens["--space-1"]).toBe("10px");
    expect(tokens["--space-2"]).toBe(baseTokens["--space-2"]);
    expect(parseToHsl(tokens["--color-bg"] as string)).toMatchObject({
      hue: 0,
      saturation: 0,
      lightness: 0,
    });
  });

  it("throws on invalid color values", () => {
    const tokens = { ...baseTokens, ...loadThemeTokensNode("invalid") };
    expect(() => parseToHsl(tokens["--color-bg"] as string)).toThrow();
  });
});
