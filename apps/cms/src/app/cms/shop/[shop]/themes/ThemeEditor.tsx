// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { ColorInput } from "@ui/components/cms";
import {
  useState,
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
} from "react";

interface Props {
  shop: string;
  themes: string[];
  tokensByTheme: Record<string, Record<string, string>>;
  initialTheme: string;
  initialTokens: Record<string, string>;
}

export default function ThemeEditor({
  shop,
  themes,
  tokensByTheme,
  initialTheme,
  initialTokens,
}: Props) {
  const [theme, setTheme] = useState(initialTheme);
  const [overrides, setOverrides] = useState<Record<string, string>>(initialTokens);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const tokenRefs = useRef<Record<string, HTMLLabelElement | null>>({});

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setTheme(next);
    setOverrides({});
  };

  const setOverride = (key: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleOverrideChange = (key: string) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setOverride(key, e.target.value);
  };

  const handleColorChange = (key: string) => (value: string) => {
    setOverride(key, value);
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

  const grouped = useMemo(() => {
    const groups: Record<string, [string, string][]> = {
      background: [],
      text: [],
      accent: [],
      other: [],
    };
    Object.entries(tokensByTheme[theme]).forEach(([k, v]) => {
      if (k.startsWith("--color-bg")) groups.background.push([k, v]);
      else if (k.startsWith("--color-fg")) groups.text.push([k, v]);
      else if (k.startsWith("--color")) groups.accent.push([k, v]);
      else groups.other.push([k, v]);
    });
    return groups;
  }, [theme, tokensByTheme]);

  const scrollToToken = (key: string) => {
    const el = tokenRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-blue-500");
      setTimeout(() => el.classList.remove("ring-2", "ring-blue-500"), 2000);
    }
  };

  const resolveValue = (key: string) =>
    overrides[key] ?? tokensByTheme[theme][key] ?? "";

  const previewItems = [
    {
      key: "--color-bg",
      label: "Background",
      element: (
        <div
          className="h-10 w-10 rounded border"
          style={{ backgroundColor: `hsl(${resolveValue("--color-bg")})` }}
        />
      ),
    },
    {
      key: "--color-fg",
      label: "Text",
      element: (
        <div
          className="flex h-10 w-10 items-center justify-center rounded border"
          style={{ color: `hsl(${resolveValue("--color-fg")})` }}
        >
          A
        </div>
      ),
    },
    {
      key: "--color-primary",
      label: "Accent",
      element: (
        <div
          className="h-10 w-10 rounded border"
          style={{ backgroundColor: `hsl(${resolveValue("--color-primary")})` }}
        />
      ),
    },
  ].filter((p) => tokensByTheme[theme][p.key] !== undefined);

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
      {previewItems.length > 0 && (
        <div className="flex gap-4">
          {previewItems.map((p) => (
            <button
              type="button"
              key={p.key}
              onClick={() => scrollToToken(p.key)}
              className="flex flex-col items-center gap-1"
            >
              {p.element}
              <span className="text-xs">{p.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-2 md:grid-cols-2">
        {(Object.keys(grouped) as (keyof typeof grouped)[]).map((group) => (
          <div key={group} className="space-y-2 md:col-span-2">
            {grouped[group].length > 0 && (
              <h3 className="mt-4 text-lg font-medium capitalize">
                {group}
              </h3>
            )}
            {grouped[group].map(([k, defaultValue]) => {
              const hasOverride = Object.prototype.hasOwnProperty.call(
                overrides,
                k
              );
              const overrideValue = hasOverride ? overrides[k] : "";
              const isOverridden =
                hasOverride && overrideValue !== defaultValue;
              const current = overrideValue || defaultValue;
              return (
                <label
                  key={k}
                  ref={(el) => (tokenRefs.current[k] = el)}
                  className={`flex flex-col gap-1 ${
                    isOverridden ? "bg-amber-50" : ""
                  }`}
                >
                  <span>{k}</span>
                  <div className="flex items-center gap-2">
                    <Input value={defaultValue} disabled />
                    {k.startsWith("--color") ? (
                      <>
                        <Input
                          placeholder={defaultValue}
                          value={overrideValue}
                          onChange={handleOverrideChange(k)}
                          className={
                            isOverridden ? "bg-amber-100" : ""
                          }
                        />
                        <ColorInput
                          value={current}
                          onChange={handleColorChange(k)}
                        />
                        <span
                          className="h-6 w-6 rounded border"
                          style={{
                            backgroundColor: `hsl(${current})`,
                          }}
                        />
                      </>
                    ) : (
                      <Input
                        placeholder={defaultValue}
                        value={overrideValue}
                        onChange={handleOverrideChange(k)}
                        className={
                          isOverridden ? "bg-amber-100" : ""
                        }
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
        ))}
      </div>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
