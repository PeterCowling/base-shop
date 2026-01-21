import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

export const themeTools = [
  {
    name: "theme_get_tokens",
    description: "Get computed theme tokens for a shop (merged base + overrides)",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
        filter: {
          type: "string",
          description: "Optional filter to match token names (e.g., 'color', 'spacing')",
        },
      },
      required: ["shop"],
    },
  },
  {
    name: "theme_list_presets",
    description: "List all saved theme presets for a shop",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
      },
      required: ["shop"],
    },
  },
  {
    name: "theme_get_preset",
    description: "Get a specific theme preset's tokens",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
        name: {
          type: "string",
          description: "Preset name",
        },
      },
      required: ["shop", "name"],
    },
  },
  {
    name: "theme_compare",
    description: "Compare theme tokens between two shops or presets",
    inputSchema: {
      type: "object",
      properties: {
        shopA: {
          type: "string",
          description: "First shop ID",
        },
        shopB: {
          type: "string",
          description: "Second shop ID (or same shop to compare presets)",
        },
        presetA: {
          type: "string",
          description: "Optional preset name for first shop",
        },
        presetB: {
          type: "string",
          description: "Optional preset name for second shop",
        },
      },
      required: ["shopA", "shopB"],
    },
  },
  {
    name: "theme_validate",
    description: "Validate theme configuration and check for issues",
    inputSchema: {
      type: "object",
      properties: {
        shop: {
          type: "string",
          description: "Shop ID",
        },
      },
      required: ["shop"],
    },
  },
] as const;

export async function handleThemeTool(name: string, args: unknown) {
  try {
    const params = (args || {}) as Record<string, unknown>;

    switch (name) {
      case "theme_get_tokens": {
        const shop = params.shop as string;
        const filter = params.filter as string | undefined;
        if (!shop) return errorResult("Shop ID is required");

        const { readShop } = await import(
          "@acme/platform-core/repositories/shops.server"
        );

        const shopData = await readShop(shop);
        let tokens = shopData.themeTokens || {};

        if (filter) {
          const lowerFilter = filter.toLowerCase();
          tokens = Object.fromEntries(
            Object.entries(tokens).filter(([key]) =>
              key.toLowerCase().includes(lowerFilter)
            )
          );
        }

        // Categorize tokens
        const categories: Record<string, Record<string, string>> = {
          colors: {},
          spacing: {},
          typography: {},
          other: {},
        };

        for (const [key, value] of Object.entries(tokens)) {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey.includes("color") ||
            lowerKey.includes("background") ||
            lowerKey.includes("border") ||
            value.toString().startsWith("#") ||
            value.toString().startsWith("rgb")
          ) {
            categories.colors[key] = value as string;
          } else if (
            lowerKey.includes("spacing") ||
            lowerKey.includes("padding") ||
            lowerKey.includes("margin") ||
            lowerKey.includes("gap")
          ) {
            categories.spacing[key] = value as string;
          } else if (
            lowerKey.includes("font") ||
            lowerKey.includes("text") ||
            lowerKey.includes("line")
          ) {
            categories.typography[key] = value as string;
          } else {
            categories.other[key] = value as string;
          }
        }

        return jsonResult({
          shop,
          filter: filter || null,
          tokens,
          tokenCount: Object.keys(tokens).length,
          categories: {
            colors: Object.keys(categories.colors).length,
            spacing: Object.keys(categories.spacing).length,
            typography: Object.keys(categories.typography).length,
            other: Object.keys(categories.other).length,
          },
          byCategory: categories,
        });
      }

      case "theme_list_presets": {
        const shop = params.shop as string;
        if (!shop) return errorResult("Shop ID is required");

        const { getThemePresets } = await import(
          "@acme/platform-core/repositories/themePresets.server"
        );

        const presets = await getThemePresets(shop);
        const presetNames = Object.keys(presets);

        const summary = presetNames.map((name) => ({
          name,
          tokenCount: Object.keys(presets[name]).length,
        }));

        return jsonResult({
          shop,
          presets: summary,
          total: presetNames.length,
        });
      }

      case "theme_get_preset": {
        const shop = params.shop as string;
        const presetName = params.name as string;
        if (!shop) return errorResult("Shop ID is required");
        if (!presetName) return errorResult("Preset name is required");

        const { getThemePresets } = await import(
          "@acme/platform-core/repositories/themePresets.server"
        );

        const presets = await getThemePresets(shop);
        const preset = presets[presetName];

        if (!preset) {
          return jsonResult({
            shop,
            name: presetName,
            found: false,
            availablePresets: Object.keys(presets),
          });
        }

        return jsonResult({
          shop,
          name: presetName,
          found: true,
          tokens: preset,
          tokenCount: Object.keys(preset).length,
        });
      }

      case "theme_compare": {
        const shopA = params.shopA as string;
        const shopB = params.shopB as string;
        const presetA = params.presetA as string | undefined;
        const presetB = params.presetB as string | undefined;

        if (!shopA || !shopB) {
          return errorResult("Both shopA and shopB are required");
        }

        const { readShop } = await import(
          "@acme/platform-core/repositories/shops.server"
        );
        const { getThemePresets } = await import(
          "@acme/platform-core/repositories/themePresets.server"
        );

        let tokensA: Record<string, string>;
        let tokensB: Record<string, string>;
        let labelA = shopA;
        let labelB = shopB;

        if (presetA) {
          const presets = await getThemePresets(shopA);
          tokensA = presets[presetA] || {};
          labelA = `${shopA}:${presetA}`;
        } else {
          const shopData = await readShop(shopA);
          tokensA = (shopData.themeTokens || {}) as Record<string, string>;
        }

        if (presetB) {
          const presets = await getThemePresets(shopB);
          tokensB = presets[presetB] || {};
          labelB = `${shopB}:${presetB}`;
        } else {
          const shopData = await readShop(shopB);
          tokensB = (shopData.themeTokens || {}) as Record<string, string>;
        }

        const allKeys = new Set([...Object.keys(tokensA), ...Object.keys(tokensB)]);
        const differences: Array<{
          token: string;
          valueA: string | null;
          valueB: string | null;
          status: "different" | "only_in_a" | "only_in_b";
        }> = [];
        const same: string[] = [];

        for (const key of allKeys) {
          const valA = tokensA[key];
          const valB = tokensB[key];

          if (valA === undefined) {
            differences.push({ token: key, valueA: null, valueB: valB, status: "only_in_b" });
          } else if (valB === undefined) {
            differences.push({ token: key, valueA: valA, valueB: null, status: "only_in_a" });
          } else if (valA !== valB) {
            differences.push({ token: key, valueA: valA, valueB: valB, status: "different" });
          } else {
            same.push(key);
          }
        }

        return jsonResult({
          comparison: {
            a: labelA,
            b: labelB,
          },
          summary: {
            totalTokens: allKeys.size,
            identical: same.length,
            different: differences.filter((d) => d.status === "different").length,
            onlyInA: differences.filter((d) => d.status === "only_in_a").length,
            onlyInB: differences.filter((d) => d.status === "only_in_b").length,
          },
          differences,
        });
      }

      case "theme_validate": {
        const shop = params.shop as string;
        if (!shop) return errorResult("Shop ID is required");

        const { readShop } = await import(
          "@acme/platform-core/repositories/shops.server"
        );

        const shopData = await readShop(shop);
        const tokens = (shopData.themeTokens || {}) as Record<string, string>;

        const issues: Array<{ type: string; message: string; token?: string }> = [];
        const warnings: Array<{ type: string; message: string; token?: string }> = [];

        // Check for common issues
        const colorTokens = Object.entries(tokens).filter(
          ([key]) =>
            key.toLowerCase().includes("color") ||
            key.toLowerCase().includes("background")
        );

        // Check for invalid hex colors
        for (const [key, value] of colorTokens) {
          if (value.startsWith("#")) {
            if (!/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value)) {
              issues.push({
                type: "invalid_color",
                message: `Invalid hex color format: ${value}`,
                token: key,
              });
            }
          }
        }

        // Check for missing common tokens
        const expectedTokens = [
          "primaryColor",
          "backgroundColor",
          "textColor",
        ];
        for (const expected of expectedTokens) {
          const found = Object.keys(tokens).some(
            (k) => k.toLowerCase() === expected.toLowerCase()
          );
          if (!found) {
            warnings.push({
              type: "missing_common_token",
              message: `Common token '${expected}' not found`,
              token: expected,
            });
          }
        }

        // Check for empty values
        for (const [key, value] of Object.entries(tokens)) {
          if (!value || value.trim() === "") {
            issues.push({
              type: "empty_value",
              message: "Token has empty value",
              token: key,
            });
          }
        }

        const isValid = issues.length === 0;

        return jsonResult({
          shop,
          valid: isValid,
          tokenCount: Object.keys(tokens).length,
          issues,
          warnings,
          summary: {
            issueCount: issues.length,
            warningCount: warnings.length,
          },
        });
      }

      default:
        return errorResult(`Unknown theme tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
