// packages/ui/src/components/cms/style/Presets.tsx
"use client";

import type { TokenMap } from "../../../hooks/useTokenEditor";
import { ReactElement } from "react";
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

  const applyPreset = (id: string) => {
    const preset = presetList?.find((p) => p.id === id);
    if (preset) {
      onChange({ ...tokens, ...preset.tokens });
    }
  };

  const resetTokens = () => {
    // Revert to defaults by clearing overrides
    onChange({});
  };

  if (presetList.length === 0) {
    return (
      <p className="text-sm text-muted" data-testid="presets-placeholder">
        No presets available
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="flex items-center gap-2">
        <span>Preset</span>
        <select
          data-testid="preset-select"
          className="rounded border p-1"
          defaultValue=""
          onChange={(e) => applyPreset(e.target.value)}
        >
          <option value="" disabled>
            Choose…
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
        data-testid="preset-reset"
        className="rounded border px-2 py-1"
        onClick={resetTokens}
      >
        Default
      </button>
    </div>
  );
}


