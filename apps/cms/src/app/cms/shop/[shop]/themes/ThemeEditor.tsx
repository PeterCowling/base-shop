// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import { useState, ChangeEvent, FormEvent } from "react";

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
  const [tokens, setTokens] = useState<Record<string, string>>({
    ...tokensByTheme[initialTheme],
    ...initialTokens,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setTheme(next);
    setTokens({ ...tokensByTheme[next] });
  };

  const handleTokenChange = (key: string) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
    setTokens((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("themeTokens", JSON.stringify(tokens));
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
      <input type="hidden" name="themeTokens" value={JSON.stringify(tokens)} />
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
      <div className="grid gap-2 md:grid-cols-2">
        {Object.entries(tokens).map(([k, v]) => (
          <label key={k} className="flex flex-col gap-1">
            <span>{k}</span>
            <Input value={v} onChange={handleTokenChange(k)} />
          </label>
        ))}
      </div>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
