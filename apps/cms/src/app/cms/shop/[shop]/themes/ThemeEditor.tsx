// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx
"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import StyleEditor from "@/components/cms/StyleEditor";
import { updateTheme } from "@cms/actions/themes.server";
import { loadThemeTokens, type TokenMap } from "@platform-core/themeTokens";
import { FormEvent, useState } from "react";

interface Props {
  shop: string;
  themes: string[];
  initialTheme: string;
  initialTokens: TokenMap;
}

export default function ThemeEditor({
  shop,
  themes,
  initialTheme,
  initialTokens,
}: Props) {
  const [theme, setTheme] = useState(initialTheme);
  const [tokens, setTokens] = useState<TokenMap>(initialTokens);
  const [saving, setSaving] = useState(false);

  const handleTheme = async (value: string) => {
    setTheme(value);
    const defaults = await loadThemeTokens(value);
    setTokens(defaults);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("id", shop);
    fd.append("themeId", theme);
    fd.append("themeTokens", JSON.stringify(tokens));
    await updateTheme(shop, fd);
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select value={theme} onValueChange={handleTheme}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <StyleEditor tokens={tokens} onChange={setTokens} />
      <Button type="submit" disabled={saving} className="bg-primary text-white">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

