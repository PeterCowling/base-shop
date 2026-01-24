// packages/ui/src/components/ThemeStyle.tsx
import * as React from "react";
import { tokens as baseTokens } from "@themes/base";

import { readShop } from "@acme/platform-core/repositories/shops.server";
// Local t shim (no runtime change); ThemeStyle is server-side and emits links/styles
const t = (s: string) => s;

function firstFamilyFromStack(stack?: string): string | null {
  if (!stack) return null;
  const m = stack.match(/"([^"]+)"/);
  if (m) return m[1];
  const first = stack.split(",")[0]?.trim();
  if (!first || first.startsWith("var(")) return null;
  return first.replace(/^["']|["']$/g, "");
}

function googleHref(name: string): string {
  return `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
}

export interface ThemeStyleProps {
  /**
   * Shop id whose theme tokens should be injected. When omitted, you must
   * provide `tokens` directly.
   */
  shopId?: string;
  /**
   * Optional pre-resolved token map to inject. If provided, `shopId` is not
   * required and no server fetch occurs.
   */
  tokens?: Record<string, string>;
  /**
   * Optional CSP nonce for the injected <style> tag.
   */
  nonce?: string;
  /**
   * Allow remote font loading via Google Fonts. Defaults to true to preserve
   * existing behavior; set false for CSP-restricted or privacy-sensitive apps.
   */
  allowRemoteFonts?: boolean;
  /**
   * Optional allowlist of font families permitted for remote loading.
   * When provided, only fonts in this list will be requested.
   */
  allowedFontFamilies?: string[];
}

const TOKEN_KEYS_WITH_DARK = new Set(
  Object.keys(baseTokens).flatMap((key) => [key, `${key}-dark`])
);

function normalizeTokenKey(raw: string): { output: string; normalized: string } | null {
  if (!raw.startsWith("--")) return null;

  // Accept explicit override keys (e.g. --token-color-bg)
  if (raw.startsWith("--token-")) {
    const normalized = `--${raw.slice("--token-".length)}`;
    if (!TOKEN_KEYS_WITH_DARK.has(normalized)) return null;
    return { output: raw, normalized };
  }

  // Accept legacy keys (e.g. --color-bg) and rewrite to override channel
  if (!TOKEN_KEYS_WITH_DARK.has(raw)) return null;
  return { output: `--token-${raw.slice(2)}`, normalized: raw };
}

function hasForbiddenChars(value: string): boolean {
  return /[;{}<>]/.test(value);
}

function isVarRef(value: string): boolean {
  return /^var\(--[a-z0-9-]+\)$/i.test(value.trim());
}

function isHslTriplet(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const parts = trimmed.split("/");
  if (parts.length > 2) return false;
  const channels = splitWhitespace(parts[0] ?? "");
  if (channels.length !== 3) return false;
  const [hue, sat, light] = channels;
  if (!isNumber(hue)) return false;
  if (!sat.endsWith("%") || !isNumber(sat.slice(0, -1))) return false;
  if (!light.endsWith("%") || !isNumber(light.slice(0, -1))) return false;
  const alpha = parts[1]?.trim();
  if (!alpha) return true;
  if (alpha.endsWith("%")) return isNumber(alpha.slice(0, -1));
  return isNumber(alpha);
}

function isColor(value: string): boolean {
  const v = value.trim();
  if (isVarRef(v)) return true;
  if (isHslTriplet(v)) return true;
  if (/^#([0-9a-f]{3,8})$/i.test(v)) return true;
  if (/^(hsl|hsla|rgb|rgba)\([^)]*\)$/i.test(v)) return true;
  return false;
}

function isLength(value: string): boolean {
  const v = value.trim();
  if (isVarRef(v)) return true;
  if (v === "0") return true;
  const units = ["px", "rem", "em", "%", "vh", "vw", "vmin", "vmax", "ch", "ex", "cm", "mm", "in", "pt", "pc"];
  const unit = units.find((candidate) => v.endsWith(candidate));
  if (!unit) return false;
  const number = v.slice(0, -unit.length);
  return isNumber(number);
}

function isNumber(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const negative = v.startsWith("-");
  const body = negative ? v.slice(1) : v;
  if (!body) return false;
  const parts = body.split(".");
  if (parts.length > 2) return false;
  const [whole, fraction] = parts;
  if (whole && !isDigits(whole)) return false;
  if (fraction && !isDigits(fraction)) return false;
  return Boolean(whole || fraction);
}

function isDigits(value: string): boolean {
  if (value.length === 0) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 48 || code > 57) return false;
  }
  return true;
}

function splitWhitespace(value: string): string[] {
  const parts: string[] = [];
  let buffer = "";
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === " " || ch === "\n" || ch === "\t" || ch === "\r" || ch === "\f") {
      if (buffer) {
        parts.push(buffer);
        buffer = "";
      }
    } else {
      buffer += ch;
    }
  }
  if (buffer) parts.push(buffer);
  return parts;
}

function isFontStack(value: string): boolean {
  const v = value.trim();
  if (isVarRef(v)) return true;
  return /^[a-zA-Z0-9\s,"'-]+$/.test(v);
}

function isShadow(value: string): boolean {
  const v = value.trim();
  if (isVarRef(v)) return true;
  return /^[a-zA-Z0-9\s#%(),.\-\/]+$/.test(v);
}

function tokenKind(name: string): "color" | "font" | "length" | "number" | "shadow" | "unknown" {
  const base = name.replace(/-dark$/, "");
  if (
    base.startsWith("--color-") ||
    base.startsWith("--surface-") ||
    base.startsWith("--border-") ||
    base.startsWith("--gradient-") ||
    base === "--ring" ||
    base === "--ring-offset" ||
    base === "--color-focus-ring" ||
    base === "--color-selection" ||
    base === "--color-highlight" ||
    base === "--color-muted" ||
    base === "--color-muted-fg" ||
    base === "--color-muted-border" ||
    base === "--hero-contrast-overlay" ||
    base === "--hero-fg" ||
    base.startsWith("--overlay-scrim-")
  ) {
    return "color";
  }
  if (base.startsWith("--font-") || base.startsWith("--typography-") || base.startsWith("--text-heading-")) {
    return "font";
  }
  if (base.startsWith("--text-")) {
    return "length";
  }
  if (
    base.startsWith("--space-") ||
    base.startsWith("--radius-") ||
    base.startsWith("--bp-") ||
    base.startsWith("--target-") ||
    base === "--ring-width" ||
    base === "--ring-offset-width"
  ) {
    return "length";
  }
  if (base.startsWith("--leading-")) return "number";
  if (base.startsWith("--z-")) return "number";
  if (base.startsWith("--shadow-") || base.startsWith("--elevation-")) return "shadow";
  return "unknown";
}

function isValidValue(key: string, value: string): boolean {
  if (!value || hasForbiddenChars(value)) return false;
  const kind = tokenKind(key);
  if (kind === "color") return isColor(value);
  if (kind === "font") return isFontStack(value);
  if (kind === "length") return isLength(value);
  if (kind === "number") return isNumber(value);
  if (kind === "shadow") return isShadow(value);
  return isVarRef(value) || /^[a-zA-Z0-9\s#%(),.\-\/]+$/.test(value.trim());
}

/**
 * Server component that injects theme tokens as CSS custom properties and
 * emits Google Font links for heading/body families.
 */
export default async function ThemeStyle({
  shopId,
  tokens: propTokens,
  nonce,
  allowRemoteFonts = false,
  allowedFontFamilies,
}: ThemeStyleProps): Promise<React.ReactElement | null> {
  let tokens = propTokens ?? {};
  if (!propTokens) {
    if (!shopId) return null;
    const data = await readShop(shopId);
    tokens = data.themeTokens ?? {};
  }

  const entries = Object.entries(tokens) as Array<[string, string]>;
  if (entries.length === 0) return null;

  const sanitized: Array<[string, string]> = [];
  const normalizedValues: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    const normalized = normalizeTokenKey(rawKey);
    if (!normalized) continue;
    const value = String(rawValue).trim();
    if (!isValidValue(normalized.normalized, value)) continue;
    sanitized.push([normalized.output, value]);
    normalizedValues[normalized.normalized] = value;
  }
  if (sanitized.length === 0) return null;

  const cssVars = sanitized.map(([k, v]) => `${k}: ${v};`).join("\n  ");

  // Alias: make font-sans follow the selected body font for Tailwind coverage
  const extra = normalizedValues["--font-body"] ? `\n  --font-sans: var(--font-body);` : "";
  const css = `:root{\n  ${cssVars}${extra}\n}`;

  const body = firstFamilyFromStack(normalizedValues["--font-body"]);
  const h1 = firstFamilyFromStack(normalizedValues["--font-heading-1"]);
  const h2 = firstFamilyFromStack(normalizedValues["--font-heading-2"]);
  const uniqueFamilies = Array.from(new Set([body, h1, h2].filter(Boolean))) as string[];
  const allowedFonts = allowedFontFamilies
    ? uniqueFamilies.filter((name) => allowedFontFamilies.includes(name))
    : uniqueFamilies;

  return (
    <>
      {allowRemoteFonts && allowedFonts.length > 0 ? (
        <>
          {/* Font loading performance hints */}
          <link rel="preconnect" href={t("https://fonts.googleapis.com")} />
          <link rel="preconnect" href={t("https://fonts.gstatic.com")} crossOrigin="anonymous" />
          {allowedFonts.map((name) => (
            <link key={name} rel="stylesheet" href={googleHref(name)} />
          ))}
        </>
      ) : null}
      <style data-shop-theme nonce={nonce}>{css}</style>
    </>
  );
}
