"use client";

import { hslToHex, hexToHsl } from "../../utils/colorUtils";

interface ColorInputProps {
  value: string; // HSL value "h s% l%"
  onChange: (value: string) => void;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }

  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

// Parse an HSL triplet in either "h s% l%" or CSS Function notation "hsl(h s% l% / a)"
// Returns [h, s, l] normalized where s,l are 0..1
function parseHslTriplet(input: string): [number, number, number] | null {
  const raw = input.trim();
  // Accept bare triplet: "h s% l%"
  if (!raw.startsWith("hsl(")) {
    const parts = raw.split(/\s+/);
    if (parts.length >= 3) {
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1]);
      const l = parseFloat(parts[2]);
      if (Number.isFinite(h) && Number.isFinite(s) && Number.isFinite(l)) {
        return [h, s / 100, l / 100];
      }
    }
    return null;
  }

  // CSS Function: hsl(h s% l% [ / a ]) or hsl(h, s%, l% [ , a ])
  const inner = raw.slice(4, -1).trim();
  // Replace commas with spaces and collapse whitespace
  const cleaned = inner.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  // Handle var() inside hsl(...)
  const resolved = resolveCssVars(cleaned);
  const tokens = resolved.split(" ");
  // Expect at least: h s% l%
  if (tokens.length < 3) return null;
  const h = parseFloat(tokens[0]);
  const s = parseFloat(tokens[1]);
  const l = parseFloat(tokens[2]);
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    return null;
  }
  return [h, s / 100, l / 100];
}

export function hslToRgb(hsl: string): [number, number, number] {
  const parsed = parseHslTriplet(hsl);
  if (!parsed) return [NaN as unknown as number, NaN as unknown as number, NaN as unknown as number];
  const [h, s, l] = parsed;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
  } else if (120 <= h && h < 180) {
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function colorToRgb(color: string): [number, number, number] {
  const v = color.trim();
  if (v.startsWith("#")) return hexToRgb(v);
  if (v.toLowerCase().startsWith("rgb")) {
    // rgb(a) parsing: rgb(r g b / a) | rgb(r, g, b) | rgba(r, g, b, a)
    const inner = v.substring(v.indexOf("(") + 1, v.lastIndexOf(")"));
    // Remove slashes and commas, collapse whitespace
    const parts = inner.replaceAll("/", " ").replace(/,/g, " ").trim().split(/\s+/);
    const r = parseFloat(parts[0]);
    const g = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    return [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n)))) as [number, number, number];
  }
  // Accept both bare triplet "h s% l%" and CSS function "hsl(...)"
  return hslToRgb(v);
}

export function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrast(color1: string, color2: string): number {
  const L1 = luminance(colorToRgb(resolveCssVars(color1)));
  const L2 = luminance(colorToRgb(resolveCssVars(color2)));
  const brightest = Math.max(L1, L2);
  const darkest = Math.min(L1, L2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function suggestContrastColor(
  color: string,
  reference: string,
  ratio = 4.5
): string | null {
  const isHex = color.startsWith("#");
  const hsl = isHex ? hexToHsl(color) : color;
  const parsed = parseHslTriplet(hsl);
  if (!parsed) return null;
  const [h, s, l] = parsed;
  const refLum = luminance(colorToRgb(resolveCssVars(reference)));
  const currentLum = luminance(colorToRgb(resolveCssVars(color)));
  const direction = currentLum > refLum ? -1 : 1;
  let newL = l;

  for (let i = 0; i < 20; i++) {
    newL += direction * 0.05;
    if (newL < 0 || newL > 1) break;
    const test = `${h} ${Math.round(s * 100)}% ${Math.round(newL * 100)}%`;
    if (getContrast(test, resolveCssVars(reference)) >= ratio) {
      return isHex ? hslToHex(test) : test;
    }
  }

  return null;
}

// Resolve CSS variable references inside an HSL/RGB string where possible.
// - hsl(var(--token) / a) -> hsl(<value> / a) if the variable exists on :root
// - hsl(var(--token)) -> hsl(<value>)
// For non-var input, returns the string unchanged.
export function resolveCssVars(input: string): string {
  if (!/var\(/.test(input)) return input;
  // Only attempt in browser-ish environments
  try {
    const d = typeof document !== "undefined" ? document.documentElement : null;
    if (!d) return input;
    return input.replace(/var\((--[a-z0-9-_]+)\)/gi, (_m, name: string) => {
      const direct = d.style.getPropertyValue(name)?.trim();
      const computed = (typeof getComputedStyle === "function") ? getComputedStyle(d).getPropertyValue(name).trim() : "";
      const val = direct || computed;
      return val || `var(${name})`;
    });
  } catch {
    return input;
  }
}

export function ColorInput({ value, onChange, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy }: ColorInputProps) {
  return (
    <input
      type="color"
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      value={hslToHex(value)}
      onChange={(e) => onChange(hexToHsl(e.target.value))}
    />
  );
}
