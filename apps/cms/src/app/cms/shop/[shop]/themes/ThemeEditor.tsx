// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { useState, ChangeEvent, FormEvent, useMemo, useRef } from "react";

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const HSL_RE = /^hsl\(/i;

function hslToHex(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return hsl;
  const [h, s, l] = parts.map((p, i) =>
    i === 0 ? parseFloat(p) : parseFloat(p) / 100
  );
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
  const normalized = hex.replace(/^#/, "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
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
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%)`;
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

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setTheme(next);
    setOverrides({});
  };

  const handleOverrideChange =
    (key: string, defaultValue: string, isHsl = false) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const formatted = isHsl ? hexToHsl(value) : value;
      setOverrides((prev) => {
        const next = { ...prev };
        if (!value || formatted === defaultValue) {
          delete next[key];
        } else {
          next[key] = formatted;
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
    fd.set("themeOverrides", JSON.stringify(overrides));
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
        value={JSON.stringify(overrides)}
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
                .filter(([, v]) => HEX_RE.test(v) || HSL_RE.test(v))
                .map(([k, defaultValue]) => {
                  const current = overrides[k] || defaultValue;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-label={k}
                      title={k}
                      className="h-6 w-6 rounded border"
                      style={{ background: current }}
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
                const isHex = HEX_RE.test(defaultValue);
                const isHsl = HSL_RE.test(defaultValue);
                const isColor = isHex || isHsl;
                const current = hasOverride ? overrideValue : defaultValue;
                const displayValue = isHsl ? hslToHex(current) : current;
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
                            value={displayValue}
                            onChange={handleOverrideChange(
                              k,
                              defaultValue,
                              isHsl
                            )}
                            ref={(el) => (overrideRefs.current[k] = el)}
                            className={isOverridden ? "bg-amber-100" : ""}
                          />
                          <span
                            className="h-6 w-6 rounded border"
                            style={{ background: current }}
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
