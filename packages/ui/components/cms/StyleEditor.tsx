// packages/ui/components/cms/StyleEditor.tsx
"use client";

import { Input } from "@/components/atoms-shadcn";

export type TokenMap = Record<`--${string}`, string>;

const sansFonts = [
  '"Geist Sans", system-ui, sans-serif',
  "Arial, sans-serif",
  "ui-sans-serif, system-ui",
];

const monoFonts = [
  '"Geist Mono", ui-monospace, monospace',
  '"Courier New", monospace',
];

function hslToHex(hsl: string): string {
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

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
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

interface StyleEditorProps {
  tokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
}

export default function StyleEditor({ tokens, onChange }: StyleEditorProps) {
  const setToken = (key: string, value: string) => {
    onChange({ ...tokens, [key]: value });
  };

  const colors: Array<[string, string]> = [];
  const fonts: Array<[string, string]> = [];
  const others: Array<[string, string]> = [];

  Object.entries(tokens).forEach(([k, v]) => {
    if (k.startsWith("--color")) {
      colors.push([k, v]);
    } else if (k.startsWith("--font")) {
      fonts.push([k, v]);
    } else {
      others.push([k, v]);
    }
  });

  const renderInput = (k: string, v: string) => {
    if (k.startsWith("--color")) {
      return (
        <label key={k} className="flex items-center gap-2 text-sm">
          <span className="w-40 flex-shrink-0">{k}</span>
          <input
            type="color"
            value={hslToHex(v)}
            onChange={(e) => setToken(k, hexToHsl(e.target.value))}
          />
        </label>
      );
    }

    if (k.startsWith("--font")) {
      const options = k.includes("mono") ? monoFonts : sansFonts;
      return (
        <label key={k} className="flex items-center gap-2 text-sm">
          <span className="w-40 flex-shrink-0">{k}</span>
          <select
            className="flex-1 rounded border p-1"
            value={v}
            onChange={(e) => setToken(k, e.target.value)}
          >
            {options.map((o) => (
              <option key={o} value={o} style={{ fontFamily: o }}>
                {o}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (/px$/.test(v)) {
      const num = parseInt(v, 10);
      return (
        <label key={k} className="flex items-center gap-2 text-sm">
          <span className="w-40 flex-shrink-0">{k}</span>
          <input
            type="range"
            min={0}
            max={64}
            value={num}
            onChange={(e) => setToken(k, `${e.target.value}px`)}
          />
          <span className="w-10 text-right">{num}px</span>
        </label>
      );
    }

    return (
      <label key={k} className="flex items-center gap-2 text-sm">
        <span className="w-40 flex-shrink-0">{k}</span>
        <Input value={v} onChange={(e) => setToken(k, e.target.value)} />
      </label>
    );
  };

  return (
    <div className="max-h-64 space-y-4 overflow-y-auto rounded border p-2">
      {colors.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Colors</p>
          {colors.map(([k, v]) => renderInput(k, v))}
        </div>
      )}
      {fonts.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Fonts</p>
          {fonts.map(([k, v]) => renderInput(k, v))}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Others</p>
          {others.map(([k, v]) => renderInput(k, v))}
        </div>
      )}
    </div>
  );
}
