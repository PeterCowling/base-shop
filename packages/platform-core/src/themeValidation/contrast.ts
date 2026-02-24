import { baseTokens } from "../themeTokens";

import { parseColorValue, type RgbaColor } from "./colorParser";
import type { ThemeContrastRequirement } from "./types";

export function evaluateThemeContrastPair(
  tokens: Record<string, string>,
  requirement: ThemeContrastRequirement,
): { ratio: number | null; reason?: string } {
  const foregroundValue = tokens[requirement.foregroundToken];
  const backgroundValue = tokens[requirement.backgroundToken];
  if (!foregroundValue || !backgroundValue) {
    return { ratio: null, reason: "missing token(s)" };
  }

  const foregroundParsed = parseColorValue(
    foregroundValue,
    tokens,
    new Set([requirement.foregroundToken]),
  );
  if (!foregroundParsed) {
    return {
      ratio: null,
      reason: `Unable to parse foreground token ${requirement.foregroundToken}`,
    };
  }
  if ("unresolvedToken" in foregroundParsed) {
    return {
      ratio: null,
      reason: `Foreground token ${requirement.foregroundToken} references unknown token ${foregroundParsed.unresolvedToken}`,
    };
  }

  const backgroundParsed = parseColorValue(
    backgroundValue,
    tokens,
    new Set([requirement.backgroundToken]),
  );
  if (!backgroundParsed) {
    return {
      ratio: null,
      reason: `Unable to parse background token ${requirement.backgroundToken}`,
    };
  }
  if ("unresolvedToken" in backgroundParsed) {
    return {
      ratio: null,
      reason: `Background token ${requirement.backgroundToken} references unknown token ${backgroundParsed.unresolvedToken}`,
    };
  }

  let resolvedBackground = backgroundParsed.color;
  if (resolvedBackground.a < 1) {
    const canvas = parseCanvasBackground(tokens);
    if (!canvas) {
      return {
        ratio: null,
        reason: "Unable to resolve background alpha without a parseable --color-bg token",
      };
    }
    resolvedBackground = compositeOver(resolvedBackground, canvas);
  }

  let resolvedForeground = foregroundParsed.color;
  if (resolvedForeground.a < 1) {
    resolvedForeground = compositeOver(resolvedForeground, resolvedBackground);
  }

  return {
    ratio: contrastRatio(resolvedForeground, resolvedBackground),
  };
}

function relativeLuminance(color: RgbaColor): number {
  const toLinear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear(color.r);
  const g = toLinear(color.g);
  const b = toLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: RgbaColor, background: RgbaColor): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

function compositeOver(foreground: RgbaColor, background: RgbaColor): RgbaColor {
  const alpha = clamp01(foreground.a + background.a * (1 - foreground.a));
  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const blend = (fg: number, bg: number): number =>
    Math.round((fg * foreground.a + bg * background.a * (1 - foreground.a)) / alpha);

  return {
    r: clamp(blend(foreground.r, background.r), 0, 255),
    g: clamp(blend(foreground.g, background.g), 0, 255),
    b: clamp(blend(foreground.b, background.b), 0, 255),
    a: alpha,
  };
}

function parseCanvasBackground(tokens: Record<string, string>): RgbaColor | null {
  const canvasValue = tokens["--color-bg"] ?? baseTokens["--color-bg"];
  if (!canvasValue) return null;
  const parsed = parseColorValue(canvasValue, tokens, new Set(["--color-bg"]));
  if (!parsed || "unresolvedToken" in parsed) return null;
  return parsed.color;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
