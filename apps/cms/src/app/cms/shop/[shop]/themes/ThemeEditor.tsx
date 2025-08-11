// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { useState, ChangeEvent, FormEvent, useMemo, useRef } from "react";

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
    (key: string, defaultValue: string) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setOverrides((prev) => {
        const next = { ...prev };
        if (!value || value === defaultValue) {
          delete next[key];
        } else {
          next[key] = value;
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
                .filter(([, v]) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v))
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
                const isHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(
                  defaultValue
                );
                const current = hasOverride ? overrideValue : defaultValue;
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
                      {isHex ? (
                        <>
                          <input
                            type="color"
                            value={current}
                            onChange={handleOverrideChange(k, defaultValue)}
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
