export const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isHex(value: string): boolean {
  return HEX_RE.test(value);
}

export function isHsl(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 3) return false;
  const [h, s, l] = parts;
  const hNum = Number(h);
  const sNum = parseFloat(s);
  const lNum = parseFloat(l);
  return (
    Number.isFinite(hNum) &&
    s.endsWith("%") &&
    l.endsWith("%") &&
    Number.isFinite(sNum) &&
    Number.isFinite(lNum)
  );
}

export function hslToHex(hsl: string): string {
  const [h, s, l] = hsl
    .split(" ")
    .map((p, i) => (i === 0 ? parseFloat(p) : parseFloat(p) / 100));
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  if (!isHex(hex)) {
    // i18n-exempt: internal developer error; not user-facing
    throw new Error("Invalid hex color");
  }

  let value = hex.slice(1);
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

export function getContrastColor(
  hex: string,
): "var(--color-fg)" | "var(--color-bg)" {
  const [r, g, b] = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 186 ? "var(--color-fg)" : "var(--color-bg)";
}

export function hexToHsl(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
