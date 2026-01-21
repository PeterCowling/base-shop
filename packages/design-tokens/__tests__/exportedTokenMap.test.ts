import { tokens } from "../../themes/base/src/tokens.ts";
import { exportedTokenMap } from "../src/exportedTokenMap.ts";

function mergeTokenMaps(
  ...maps: Array<Record<string, string>>
): Record<string, string> {
  return maps.reduce<Record<string, string>>((acc, map) => {
    for (const [key, value] of Object.entries(map)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

describe("exportedTokenMap", () => {
  it("matches source token definitions", () => {
    const expected = Object.fromEntries(
      Object.keys(tokens)
        .filter((k) => k in exportedTokenMap)
        .map((k) => [k, `var(${k})`])
    );
    expect(exportedTokenMap).toMatchObject(expected);
  });

  it("has no extra or missing keys", () => {
    const exportedKeys = Object.keys(exportedTokenMap).sort();
    const tokenKeys = Object.keys(tokens).sort();
    expect(exportedKeys).toEqual(tokenKeys);
  });

  it("merges tokens with overrides", () => {
    const overrides = {
      "--color-bg": "var(--custom-bg)",
      "--new-token": "var(--new-token)",
    };
    const merged = mergeTokenMaps(exportedTokenMap, overrides);
    expect(merged["--color-bg"]).toBe("var(--custom-bg)");
    expect(merged["--new-token"]).toBe("var(--new-token)");
    expect(merged["--color-fg"]).toBe(exportedTokenMap["--color-fg"]);
  });

  it("handles duplicate keys by overriding with last value", () => {
    const first = { "--color-bg": "var(--first-bg)" };
    const second = { "--color-bg": "var(--second-bg)" };
    const merged = mergeTokenMaps(first, second);
    expect(merged["--color-bg"]).toBe("var(--second-bg)");
  });

  it("uses valid CSS variable formatting", () => {
    for (const value of Object.values(exportedTokenMap)) {
      expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/);
    }
  });
});

