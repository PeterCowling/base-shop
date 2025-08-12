// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { useState, ChangeEvent, FormEvent, useMemo, useRef } from "react";

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const HSL_RE = /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/;

function isHex(value: string) {
  return HEX_RE.test(value);
}

function isHsl(value: string) {
  return HSL_RE.test(value);
}

function hslToHex(hsl: string): string {
  const [h, s, l] = hsl
    .split(/\s+/)
    .map((part, i) => (i === 0 ? parseFloat(part) : parseFloat(part) / 100));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToHsl(hex: string): string {
  let r = 0,
    g = 0,
    b = 0;
  let cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
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
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface Props {
  shop: string;
  themes: string[];
  tokensByTheme: Record<string, Record<string, string>>;
  initialTheme: string;
  initialOverrides: Record<string, string>;
}

export default function ThemeEditor({
  shop,
  themes,
  tokensByTheme,
  initialTheme,
  initialOverrides,
}: Props) {
  const [theme, setTheme] = useState(initialTheme);
  const [overrides, setOverrides] =
    useState<Record<string, string>>(initialOverrides);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const overrideRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const groupedTokens = useMemo(() => {
    const tokens = tokensByTheme[theme];
    const groups: Record<string, [string, string][]> = {
      Background: [],
      Text: [],
      Accent: [],
      Other: [],
    };
    Object.entries(tokens).forEach(([k, v]) => {
      if (/bg|background/i.test(k)) groups.Background.push([k, v]);
      else if (/text|foreground/i.test(k)) groups.Text.push([k, v]);
      else if (/accent|primary|secondary|highlight/i.test(k))
        groups.Accent.push([k, v]);
      else groups.Other.push([k, v]);
    });
    return groups;
  }, [theme, tokensByTheme]);

  const changedOverrides = useMemo(() => {
    const tokens = tokensByTheme[theme];
    return Object.fromEntries(
      Object.entries(overrides).filter(([k, v]) => tokens[k] !== v)
    );
  }, [overrides, tokensByTheme, theme]);

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setTheme(next);
    setOverrides({});
  };

  const handleOverrideChange =
    (key: string, defaultValue: string) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const converted = isHsl(defaultValue) ? hexToHsl(value) : value;
      setOverrides((prev) => {
        const next = { ...prev };
        if (!value || converted === defaultValue) {
          delete next[key];
        } else {
          next[key] = converted;
        }
        return next;
      });
    };

  const handleReset = (key: string) => () => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("themeOverrides", JSON.stringify(changedOverrides));
    const result = await updateShop(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.shop) {
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input type="hidden" name="id" value={shop} />
      <input
        type="hidden"
        name="themeOverrides"
        value={JSON.stringify(changedOverrides)}
      />
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <select
          className="border p-2"
          name="themeId"
          value={theme}
          onChange={handleThemeChange}
        >
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.themeId && (
          <span className="text-sm text-red-600">
            {errors.themeId.join("; ")}
          </span>
        )}
      </label>
      <div className="space-y-6">
        {Object.entries(groupedTokens).map(([groupName, tokens]) => (
          <fieldset key={groupName} className="space-y-2">
            <legend className="font-semibold">{groupName}</legend>
            <div className="mb-2 flex flex-wrap gap-2">
              {tokens
                .filter(([, v]) => isHex(v) || isHsl(v))
                .map(([k, defaultValue]) => {
                  const current = overrides[k] || defaultValue;
                  const colorValue = isHsl(defaultValue)
                    ? isHex(current)
                      ? current
                      : hslToHex(current)
                    : current;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-label={k}
                      title={k}
                      className="h-6 w-6 rounded border"
                      style={{ background: colorValue }}
                      onClick={() => {
                        overrideRefs.current[k]?.scrollIntoView?.({
                          behavior: "smooth",
                          block: "center",
                        });
                        overrideRefs.current[k]?.focus();
                      }}
                    />
                  );
                })}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {tokens.map(([k, defaultValue]) => {
                const hasOverride = Object.prototype.hasOwnProperty.call(
                  overrides,
                  k
                );
                const overrideValue = hasOverride ? overrides[k] : "";
                const isOverridden =
                  hasOverride && overrideValue !== defaultValue;
                const defaultIsHsl = isHsl(defaultValue);
                const defaultIsHex = isHex(defaultValue);
                const isColor = defaultIsHsl || defaultIsHex;
                const currentOriginal = hasOverride ? overrideValue : defaultValue;
                const colorValue = defaultIsHsl
                  ? isHex(currentOriginal)
                    ? currentOriginal
                    : hslToHex(currentOriginal)
                  : currentOriginal;
                return (
                  <label
                    key={k}
                    className={`flex flex-col gap-1 ${
                      isOverridden ? "bg-amber-50" : ""
                    }`}
                  >
                    <span>{k}</span>
                    <div className="flex items-center gap-2">
                      <Input value={defaultValue} disabled />
                      {isColor ? (
                        <>
                          <input
                            type="color"
                            value={colorValue}
                            onChange={handleOverrideChange(k, defaultValue)}
                            ref={(el) => (overrideRefs.current[k] = el)}
                            className={isOverridden ? "bg-amber-100" : ""}
                          />
                          <span
                            className="h-6 w-6 rounded border"
                            style={{ background: colorValue }}
                          />
                        </>
                      ) : (
                        <Input
                          placeholder={defaultValue}
                          value={overrideValue}
                          onChange={handleOverrideChange(k, defaultValue)}
                          ref={(el) => (overrideRefs.current[k] = el)}
                          className={isOverridden ? "bg-amber-100" : ""}
                        />
                      )}
                      {hasOverride && (
                        <Button type="button" onClick={handleReset(k)}>
                          Reset
                        </Button>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
