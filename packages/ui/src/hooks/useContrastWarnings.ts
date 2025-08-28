import { useMemo } from "react";
function resolveColor(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("#")) {
    if (value.length === 4) {
      const [r, g, b] = [value[1], value[2], value[3]];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return value.toLowerCase();
  }
  return undefined;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(a: string, b: string): number {
  const L1 = luminance(a);
  const L2 = luminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function useContrastWarnings(fg?: string, bg?: string) {
  return useMemo(() => {
    const fgHex = resolveColor(fg);
    const bgHex = resolveColor(bg);
    if (!fgHex || !bgHex) return undefined;
    const ratio = contrast(fgHex, bgHex);
    if (ratio < 4.5) {
      return `Contrast ratio ${ratio.toFixed(2)} is below AA`;
    }
    return undefined;
  }, [fg, bg]);
}

export default useContrastWarnings;
