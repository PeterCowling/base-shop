// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import {
  useState,
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
  useEffect,
  type CSSProperties,
} from "react";
import {
  hslToHex,
  isHex,
  isHsl,
} from "@ui/utils/colorUtils";
import { useThemePresets } from "./useThemePresets";
import ColorInput from "./ColorInput";
import InlineColorPicker from "./InlineColorPicker";
import WizardPreview from "../../../wizard/WizardPreview";
import { savePreviewTokens } from "../../../wizard/previewTokens";

interface Props {
  shop: string;
  themes: string[];
  tokensByTheme: Record<string, Record<string, string>>;
  initialTheme: string;
  initialOverrides: Record<string, string>;
  presets: string[];
}

export default function ThemeEditor({
  shop,
  themes,
  tokensByTheme,
  initialTheme,
  initialOverrides,
  presets,
}: Props) {
  const [theme, setTheme] = useState(initialTheme);
  const [overrides, setOverrides] =
    useState<Record<string, string>>(initialOverrides);
  const [themeDefaults, setThemeDefaults] = useState<Record<string, string>>(
    tokensByTheme[initialTheme],
  );
  const {
    availableThemes,
    tokensByThemeState,
    presetThemes,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
  } = useThemePresets({
    shop,
    initialThemes: themes,
    initialTokensByTheme: tokensByTheme,
    presets,
    theme,
    overrides,
    setTheme,
    setOverrides,
    setThemeDefaults,
  });
  const [contrastWarnings, setContrastWarnings] =
    useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const overrideRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewTokens, setPreviewTokens] = useState<Record<string, string>>({
    ...tokensByThemeState[initialTheme],
    ...initialOverrides,
  });
  const debounceRef = useRef<number | null>(null);
  const [picker, setPicker] = useState<
    | null
    | { token: string; x: number; y: number; defaultValue: string }
  >(null);

  const mergedTokens = useMemo(
    () => ({ ...tokensByThemeState[theme], ...overrides }),
    [theme, tokensByThemeState, overrides],
  );

  const textTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /text|foreground/i.test(k),
      ),
    [theme, tokensByThemeState],
  );

  const bgTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /bg|background/i.test(k),
      ),
    [theme, tokensByThemeState],
  );

  const groupedTokens = useMemo(() => {
    const tokens = tokensByThemeState[theme];
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
  }, [theme, tokensByThemeState]);

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const currentOverrides = overrides;
    let keep = false;
    if (Object.keys(currentOverrides).length > 0) {
      keep = window.confirm("Keep current overrides?");
    }
    setTheme(next);
    const defaults = tokensByThemeState[next];
    setThemeDefaults(defaults);
    const merged = keep ? { ...defaults, ...currentOverrides } : defaults;
    setOverrides(keep ? { ...currentOverrides } : {});
    schedulePreviewUpdate(merged);
    setContrastWarnings({});
  };

  const schedulePreviewUpdate = (tokens: Record<string, string>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      setPreviewTokens(tokens);
    }, 100);
  };

  const handleWarningChange = (token: string, warning: string | null) => {
    setContrastWarnings((prev) => {
      const next = { ...prev };
      if (warning) next[token] = warning;
      else delete next[token];
      return next;
    });
  };

  const handleOverrideChange =
    (key: string, defaultValue: string) =>
    (value: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        if (!value || value === defaultValue) {
          delete next[key];
        } else {
          next[key] = value;
        }
        const merged = { ...tokensByThemeState[theme], ...next };
        schedulePreviewUpdate(merged);
        return next;
      });
    };

  const handleReset = (key: string) => () => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      const merged = { ...tokensByThemeState[theme], ...next };
      schedulePreviewUpdate(merged);
      return next;
    });
  };

  const handleTokenSelect = (
    token: string,
    coords?: { x: number; y: number },
  ) => {
    const input = overrideRefs.current[token];
    if (input) {
      input.scrollIntoView?.({ behavior: "smooth", block: "center" });
      input.focus();
    }
    if (coords) {
      const defaultValue = tokensByThemeState[theme][token];
      setPicker({ token, x: coords.x, y: coords.y, defaultValue });
    } else if (input) {
      (input as any).showPicker?.();
      if (!(input as any).showPicker) {
        input.click();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);


  useEffect(() => {
    savePreviewTokens(previewTokens);
  }, [previewTokens]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("themeOverrides", JSON.stringify(overrides));
    fd.set("themeDefaults", JSON.stringify(themeDefaults));
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
      {picker && (
        <InlineColorPicker
          token={picker.token}
          defaultValue={picker.defaultValue}
          value={overrides[picker.token] || picker.defaultValue}
          x={picker.x}
          y={picker.y}
          onChange={handleOverrideChange(picker.token, picker.defaultValue)}
          onClose={() => {
            setPicker(null);
            const merged = { ...tokensByThemeState[theme], ...overrides };
            schedulePreviewUpdate(merged);
          }}
        />
      )}
      <input
        type="hidden"
        name="themeOverrides"
        value={JSON.stringify(overrides)}
      />
      <input
        type="hidden"
        name="themeDefaults"
        value={JSON.stringify(themeDefaults)}
      />
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <select
          className="border p-2"
          name="themeId"
          value={theme}
          onChange={handleThemeChange}
        >
          {availableThemes.map((t) => (
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
      <div className="flex items-center gap-2">
        <Input
          placeholder="Preset name"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
        />
        <Button type="button" onClick={handleSavePreset} disabled={!presetName.trim()}>
          Save Preset
        </Button>
        {presetThemes.includes(theme) && (
          <Button type="button" onClick={handleDeletePreset}>
            Delete Preset
          </Button>
        )}
      </div>
      {Object.keys(contrastWarnings).length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
          <p>Contrast warnings:</p>
          <ul className="list-disc pl-4">
            {Object.values(contrastWarnings).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <WizardPreview
        style={previewTokens as CSSProperties}
        inspectMode
        onTokenSelect={handleTokenSelect}
      />
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
                      onClick={() => handleTokenSelect(k)}
                    />
                  );
                })}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {tokens.map(([k, defaultValue]) => {
                const hasOverride = Object.prototype.hasOwnProperty.call(
                  overrides,
                  k,
                );
                const overrideValue = hasOverride ? overrides[k] : "";
                return (
                  <ColorInput
                    key={k}
                    name={k}
                    defaultValue={defaultValue}
                    value={overrideValue}
                    onChange={handleOverrideChange(k, defaultValue)}
                    onReset={handleReset(k)}
                    inputRef={(el) => (overrideRefs.current[k] = el)}
                    tokens={mergedTokens}
                    textTokens={textTokenKeys}
                    bgTokens={bgTokenKeys}
                    onWarningChange={handleWarningChange}
                  />
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
