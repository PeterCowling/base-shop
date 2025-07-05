// packages/ui/components/cms/StyleEditor.tsx
"use client";

import { Input } from "@/components/atoms-shadcn";
import { useTokenEditor, type TokenMap } from "@ui/hooks/useTokenEditor";
import { ColorInput, FontSelect, RangeInput } from "./index";

interface StyleEditorProps {
  tokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
}

export default function StyleEditor({ tokens, onChange }: StyleEditorProps) {
  const {
    colors,
    fonts,
    others,
    sansFonts,
    monoFonts,
    googleFonts,
    newFont,
    setNewFont,
    setToken,
    handleUpload,
    addCustomFont,
    setGoogleFont,
  } = useTokenEditor(tokens, onChange);

  const renderInput = (k: string, v: string) => {
    if (k.startsWith("--color")) {
      return (
        <label key={k} className="flex items-center gap-2 text-sm">
          <span className="w-40 flex-shrink-0">{k}</span>
          <ColorInput value={v} onChange={(val) => setToken(k, val)} />
        </label>
      );
    }

    if (k.startsWith("--font")) {
      const options = k.includes("mono") ? monoFonts : sansFonts;
      const type: "mono" | "sans" = k.includes("mono") ? "mono" : "sans";
      return (
        <label key={k} className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-40 flex-shrink-0">{k}</span>
            <FontSelect
              value={v}
              options={options}
              onChange={(val) => setToken(k, val)}
              onUpload={(e) => handleUpload(type, e)}
            />
            <select
              className="rounded border p-1"
              onChange={(e) => {
                if (e.target.value) {
                  setGoogleFont(type, e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Google Fonts</option>
              {googleFonts.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </span>
        </label>
      );
    }

    if (/px$/.test(v)) {
      return (
        <label key={k} className="flex items-center gap-2 text-sm">
          <span className="w-40 flex-shrink-0">{k}</span>
          <RangeInput value={v} onChange={(val) => setToken(k, val)} />
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
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Add font stack"
              value={newFont}
              onChange={(e) => setNewFont(e.target.value)}
            />
            <button
              type="button"
              className="rounded border px-2 py-1"
              onClick={addCustomFont}
            >
              Add
            </button>
          </div>
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
