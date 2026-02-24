import { clamp, clamp01 } from "@acme/lib";

import { isCssCustomPropertyName } from "./constants";

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type ParsedColor = { color: RgbaColor } | { unresolvedToken: string };

export function parseColorValue(
  input: string,
  tokens: Record<string, string>,
  visitedTokens: Set<string>,
  depth = 0,
): ParsedColor | null {
  if (depth > 12) return null;

  const raw = input.trim();
  if (!raw) return null;

  const alphaSplit = splitTopLevelOnce(raw, "/");
  if (alphaSplit.after && alphaSplit.before !== raw) {
    const baseColor = parseColorValue(alphaSplit.before, tokens, visitedTokens, depth + 1);
    if (!baseColor) return null;
    if ("unresolvedToken" in baseColor) return baseColor;
    const alpha = parseAlpha(alphaSplit.after);
    if (alpha == null) return null;
    return {
      color: {
        ...baseColor.color,
        a: clamp01(baseColor.color.a * alpha),
      },
    };
  }

  if (raw.startsWith("var(") && raw.endsWith(")")) {
    const parsedVar = parseVarExpression(raw);
    if (!parsedVar) return null;
    if (visitedTokens.has(parsedVar.tokenName)) return null;

    if (parsedVar.tokenName in tokens) {
      const nextVisited = new Set(visitedTokens);
      nextVisited.add(parsedVar.tokenName);
      return parseColorValue(tokens[parsedVar.tokenName], tokens, nextVisited, depth + 1);
    }

    if (parsedVar.fallback) {
      return parseColorValue(parsedVar.fallback, tokens, visitedTokens, depth + 1);
    }

    return { unresolvedToken: parsedVar.tokenName };
  }

  if (raw.startsWith("hsl(") && raw.endsWith(")")) {
    return parseHslFunction(raw, tokens, visitedTokens, depth + 1);
  }

  if (raw.startsWith("rgb(") && raw.endsWith(")")) {
    return parseRgbFunction(raw);
  }

  const hex = parseHexColor(raw);
  if (hex) {
    return { color: hex };
  }

  const hsl = parseRawHslColor(raw);
  if (hsl) {
    return { color: hsl };
  }

  if (isCssCustomPropertyName(raw) && raw in tokens) {
    if (visitedTokens.has(raw)) return null;
    const nextVisited = new Set(visitedTokens);
    nextVisited.add(raw);
    return parseColorValue(tokens[raw], tokens, nextVisited, depth + 1);
  }

  return null;
}

function splitTopLevelOnce(input: string, separator: string): { before: string; after: string | null } {
  let depth = 0;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === separator && depth === 0) {
      return {
        before: input.slice(0, index).trim(),
        after: input.slice(index + 1).trim(),
      };
    }
  }
  return { before: input.trim(), after: null };
}

function parseVarExpression(input: string): { tokenName: string; fallback: string | null } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("var(") || !trimmed.endsWith(")")) return null;
  const inner = trimmed.slice(4, -1).trim();
  const split = splitTopLevelOnce(inner, ",");
  const tokenName = split.before.trim();
  if (!isCssCustomPropertyName(tokenName)) return null;
  return {
    tokenName,
    fallback: split.after && split.after.length > 0 ? split.after : null,
  };
}

function parseHexColor(input: string): RgbaColor | null {
  const value = input.trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return null;

  let normalized = value.slice(1);
  if (normalized.length === 3 || normalized.length === 4) {
    normalized = normalized
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }

  const hasAlpha = normalized.length === 8;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const a = hasAlpha ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function parseRawHslColor(input: string): RgbaColor | null {
  const cleaned = input.replaceAll(",", " ").replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  if (parts.length < 3) return null;

  const hue = Number.parseFloat(parts[0]);
  const saturation = parsePercentage(parts[1]);
  const lightness = parsePercentage(parts[2]);
  if (!Number.isFinite(hue) || saturation == null || lightness == null) return null;

  return {
    ...hslToRgb(hue, saturation, lightness),
    a: 1,
  };
}

function parseHslFunction(
  input: string,
  tokens: Record<string, string>,
  visitedTokens: Set<string>,
  depth: number,
): ParsedColor | null {
  const inner = input.slice(4, -1).trim();
  const alphaSplit = splitTopLevelOnce(inner, "/");
  const base = alphaSplit.before.trim();
  const alpha = alphaSplit.after ? parseAlpha(alphaSplit.after) : 1;
  if (alpha == null) return null;

  const parsedBase = parseColorValue(base, tokens, visitedTokens, depth + 1);
  if (!parsedBase) return null;
  if ("unresolvedToken" in parsedBase) return parsedBase;

  return {
    color: {
      ...parsedBase.color,
      a: clamp01(parsedBase.color.a * alpha),
    },
  };
}

function parseRgbFunction(input: string): ParsedColor | null {
  const inner = input.slice(4, -1).trim();
  const alphaSplit = splitTopLevelOnce(inner, "/");
  const channelPart = alphaSplit.before.replaceAll(",", " ").replace(/\s+/g, " ").trim();
  const channels = channelPart.split(" ");
  if (channels.length < 3) return null;

  const red = parseRgbChannel(channels[0]);
  const green = parseRgbChannel(channels[1]);
  const blue = parseRgbChannel(channels[2]);
  const alpha = alphaSplit.after ? parseAlpha(alphaSplit.after) : 1;
  if (red == null || green == null || blue == null || alpha == null) return null;

  return {
    color: {
      r: red,
      g: green,
      b: blue,
      a: alpha,
    },
  };
}

function parsePercentage(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed.endsWith("%")) return null;
  const value = Number.parseFloat(trimmed.slice(0, -1));
  if (!Number.isFinite(value)) return null;
  return clamp01(value / 100);
}

function parseRgbChannel(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    if (!Number.isFinite(percent)) return null;
    return clamp(Math.round((percent / 100) * 255), 0, 255);
  }
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return null;
  return clamp(Math.round(numeric), 0, 255);
}

function parseAlpha(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    if (!Number.isFinite(percent)) return null;
    return clamp01(percent / 100);
  }
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return null;
  return clamp01(numeric);
}

function hslToRgb(hue: number, saturation: number, lightness: number): Omit<RgbaColor, "a"> {
  const normalizedHue = normalizeHue(hue) / 60;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((normalizedHue % 2) - 1));
  const m = lightness - chroma / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (normalizedHue >= 0 && normalizedHue < 1) {
    rPrime = chroma;
    gPrime = x;
  } else if (normalizedHue >= 1 && normalizedHue < 2) {
    rPrime = x;
    gPrime = chroma;
  } else if (normalizedHue >= 2 && normalizedHue < 3) {
    gPrime = chroma;
    bPrime = x;
  } else if (normalizedHue >= 3 && normalizedHue < 4) {
    gPrime = x;
    bPrime = chroma;
  } else if (normalizedHue >= 4 && normalizedHue < 5) {
    rPrime = x;
    bPrime = chroma;
  } else {
    rPrime = chroma;
    bPrime = x;
  }

  return {
    r: clamp(Math.round((rPrime + m) * 255), 0, 255),
    g: clamp(Math.round((gPrime + m) * 255), 0, 255),
    b: clamp(Math.round((bPrime + m) * 255), 0, 255),
  };
}

function normalizeHue(hue: number): number {
  const normalized = hue % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
