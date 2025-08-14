// apps/cms/src/app/cms/shop/[shop]/themes/ThemeSelector.tsx
"use client";
import { ChangeEvent } from "react";

interface Props {
  themes: string[];
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export default function ThemeSelector({ themes, value, onChange }: Props) {
  return (
    <label className="flex flex-col gap-1">
      <span>Theme</span>
      <select
        className="border p-2"
        name="themeId"
        value={value}
        onChange={onChange}
      >
        {themes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
