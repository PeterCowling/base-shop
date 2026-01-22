// packages/ui/src/components/cms/style/Presets.tsx
"use client";

import { type ReactElement } from "react";

import { useTranslations } from "@acme/i18n";
import type { TokenMap } from "@acme/ui/hooks/useTokenEditor";

import presetData from "./presets.json";

interface PresetsProps {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
}

interface PresetOption {
  id: string;
  name: string;
  tokens: TokenMap;
}

const presetList = presetData as unknown as PresetOption[];

export default function Presets({
  tokens,
  onChange,
}: PresetsProps): ReactElement {
  const t = useTranslations();
   
  const PRESET_SELECT_CLASS = "rounded border p-1";
   
  const PLACEHOLDER_P_CLASS = "text-sm text-muted";
  const applyPreset = (id: string) => {
    const preset = presetList?.find((p) => p.id === id);
    if (preset) {
      onChange({ ...tokens, ...preset.tokens });
      // Heuristically load Google Fonts for known families to keep previews WYSIWYG
       
      const googleFamilies = new Set([
        "Inter",
        "Space Grotesk",
        "Playfair Display",
        "Lato",
        "Source Sans 3",
        "Montserrat",
        "Rubik",
        "Work Sans",
        "Nunito",
        "Quicksand",
        "Open Sans",
        "Roboto",
        "Merriweather",
        "Poppins",
      ]);
       
      const injectGoogle = (name: string) => {
        const id = `google-font-${name}`;
        if (!document.getElementById(id)) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
          document.head.appendChild(link);
        }
      };
      Object.values(preset.tokens).forEach((v) => {
        if (typeof v !== "string") return;
        const match = v.match(/"([^"]+)"/);
        const name = match?.[1];
        if (name && googleFamilies.has(name)) injectGoogle(name);
      });
    }
  };

  const resetTokens = () => {
    // Revert to defaults by clearing overrides
    onChange({});
  };

  if (presetList.length === 0) {
     
    return (
      <p className={PLACEHOLDER_P_CLASS} data-cy="presets-placeholder">
        {t("cms.style.presets.none") as string}
      </p>
    );
     
  }

   
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex items-center gap-2">
        <span>{t("cms.style.presets.label") as string}</span>
        <select
          data-cy="preset-select"
          className={PRESET_SELECT_CLASS}
          defaultValue=""
          onChange={(e) => applyPreset(e.target.value)}
        >
          <option value="" disabled>
            {t("cms.style.presets.choose") as string}
          </option>
          {presetList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        data-cy="preset-reset"
        className="rounded border px-2 py-1 min-h-10 min-w-10"
        onClick={resetTokens}
      >
        {t("common.default") as string}
      </button>
    </div>
  );
   
}
