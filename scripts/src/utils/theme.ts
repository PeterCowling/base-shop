import { readFileSync } from "node:fs";

import { loadBaseTokens } from "@acme/platform-core/createShop";

import { generateThemeTokens } from "../generate-theme";

import { prompt } from "./prompts";

export async function promptThemeOverrides(): Promise<Record<string, string>> {
  const overrides: Record<string, string> = {};
  const argv = process.argv.slice(2);
  const brandIndex = argv.indexOf("--brand");
  const tokensIndex = argv.indexOf("--tokens");

  const brandArg = brandIndex !== -1 ? argv[brandIndex + 1] : undefined;
  const tokensFile = tokensIndex !== -1 ? argv[tokensIndex + 1] : undefined;

  if (brandArg || tokensFile) {
    if (brandArg) {
      try {
        const base = loadBaseTokens();
        const tokens = generateThemeTokens(brandArg);
        for (const [k, v] of Object.entries(tokens)) {
          if (base[k] !== v) overrides[k] = v;
        }
      } catch {
        console.error("Invalid color format.");
      }
    }
    if (tokensFile) {
      try {
        const content = readFileSync(tokensFile, "utf8");
        const json = JSON.parse(content) as Record<string, string>;
        Object.assign(overrides, json);
      } catch {
        console.error("Failed to load token overrides from file.");
      }
    }
    return overrides;
  }

  const brand = await prompt("Primary brand color (hex, blank to skip): ");
  if (brand) {
    try {
      const base = loadBaseTokens();
      const tokens = generateThemeTokens(brand);
      for (const [k, v] of Object.entries(tokens)) {
        if (base[k] !== v) overrides[k] = v;
      }
    } catch {
      console.error("Invalid color format.");
    }
  }
  while (true) {
    const entry = await prompt(
      "Theme token override (key=value, blank to finish): ",
    );
    if (!entry) break;
    const [key, value] = entry.split("=").map((s) => s.trim());
    if (key && value) {
      overrides[key] = value;
    } else {
      console.error("Invalid token override format.");
    }
  }
  return overrides;
}
