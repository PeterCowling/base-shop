"use client";

import { hslToHex, hexToHsl } from "../../utils/colorUtils";

interface ColorInputProps {
  value: string; // HSL value "h s% l%"
  onChange: (value: string) => void;
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

export function hslToRgb(hsl: string): [number, number, number] {
  const [h, s, l] = hsl
    .split(" ")
    .map((p: string, i: number) =>
      i === 0 ? parseFloat(p) : parseFloat(p) / 100
    );
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
  return color.startsWith("#") ? hexToRgb(color) : hslToRgb(color);
}

export function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrast(color1: string, color2: string): number {
  const L1 = luminance(colorToRgb(color1));
  const L2 = luminance(colorToRgb(color2));
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
  const [h, s, l] = hsl.split(" ").map((p: string, i: number) =>
    i === 0 ? parseFloat(p) : parseFloat(p) / 100
  );
  const refLum = luminance(colorToRgb(reference));
  const currentLum = luminance(colorToRgb(color));
  const direction = currentLum > refLum ? -1 : 1;
  let newL = l;

  for (let i = 0; i < 20; i++) {
    newL += direction * 0.05;
    if (newL < 0 || newL > 1) break;
    const test = `${h} ${Math.round(s * 100)}% ${Math.round(newL * 100)}%`;
    if (getContrast(test, reference) >= ratio) {
      return isHex ? hslToHex(test) : test;
    }
  }

  return null;
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <input
      type="color"
      value={hslToHex(value)}
      onChange={(e) => onChange(hexToHsl(e.target.value))}
    />
  );
}
