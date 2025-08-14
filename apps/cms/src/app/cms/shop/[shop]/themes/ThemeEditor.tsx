// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { updateShop } from "@cms/actions/shops.server";
import ColorContrastChecker from "color-contrast-checker";
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
import WizardPreview from "../../../wizard/WizardPreview";
import { savePreviewTokens } from "../../../wizard/previewTokens";
import { tokenGroups } from "./tokenGroups";

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
  const [contrastWarnings, setContrastWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const overrideRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewTokens, setPreviewTokens] = useState<Record<string, string>>({
    ...tokensByThemeState[initialTheme],
    ...initialOverrides,
  });
  const debounceRef = useRef<number | null>(null);

  const groupedTokens = useMemo(() => {
    const tokens = tokensByThemeState[theme];
    const groups: Record<string, [string, string][]> = {};

    // Populate configured groups
    Object.entries(tokenGroups).forEach(([groupName, tokenList]) => {
      const entries = tokenList
        .filter((t) => Object.prototype.hasOwnProperty.call(tokens, t))
        .map((t) => [t, tokens[t]] as [string, string]);
      if (entries.length) {
        groups[groupName] = entries;
      }
    });

    // Collect tokens not assigned to a group
    const assigned = new Set(Object.values(tokenGroups).flat());
    const other: [string, string][] = [];
    Object.entries(tokens).forEach(([k, v]) => {
      if (!assigned.has(k)) {
        other.push([k, v]);
      }
    });
    if (other.length) {
      groups.Other = other;
    }

    return groups;
  }, [theme, tokensByThemeState]);

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setTheme(next);
    setOverrides({});
    setThemeDefaults(tokensByThemeState[next]);
    schedulePreviewUpdate(tokensByThemeState[next]);
  };

  const schedulePreviewUpdate = (tokens: Record<string, string>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      setPreviewTokens(tokens);
    }, 100);
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

  const handleGroupReset = (keys: string[]) => () => {
    setOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      keys.forEach((k) => {
        if (k in next) {
          delete next[k];
          changed = true;
        }
      });
      if (!changed) return prev;
      const merged = { ...tokensByThemeState[theme], ...next };
      schedulePreviewUpdate(merged);
      return next;
    });
  };

  const handleTokenSelect = (token: string) => {
    const input = overrideRefs.current[token];
    if (!input) return;
    input.scrollIntoView?.({ behavior: "smooth", block: "center" });
    input.focus();
    (input as any).showPicker?.();
    if (!(input as any).showPicker) {
      input.click();
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
    const ccc = new ColorContrastChecker();
    const baseTokens = tokensByThemeState[theme];
    const merged = previewTokens;
    const textTokens = Object.keys(baseTokens).filter((k) =>
      /text|foreground/i.test(k),
    );
    const bgTokens = Object.keys(baseTokens).filter((k) =>
      /bg|background/i.test(k),
    );
    const warnings: string[] = [];
    textTokens.forEach((t) => {
      const fg = merged[t];
      const fgDefault = baseTokens[t];
      bgTokens.forEach((b) => {
        const bg = merged[b];
        const bgDefault = baseTokens[b];
        if (!fg || !bg) return;
        const fgHex = isHsl(fg) ? hslToHex(fg) : fg;
        const bgHex = isHsl(bg) ? hslToHex(bg) : bg;
        if (!isHex(fgHex) || !isHex(bgHex)) return;
        const fgDefHex = isHsl(fgDefault) ? hslToHex(fgDefault) : fgDefault;
        const bgDefHex = isHsl(bgDefault) ? hslToHex(bgDefault) : bgDefault;
        const defaultRatio = ccc.getContrastRatio(fgDefHex, bgDefHex);
        const ratio = ccc.getContrastRatio(fgHex, bgHex);
        if (ratio < defaultRatio && ratio < 4.5) {
          warnings.push(
            `${t} on ${b} contrast ${ratio.toFixed(2)}:1`,
          );
        }
      });
    });
    setContrastWarnings(warnings);
  }, [theme, previewTokens, tokensByThemeState]);

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
      {contrastWarnings.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
          <p>Contrast warnings:</p>
          <ul className="list-disc pl-4">
            {contrastWarnings.map((w, i) => (
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
        {Object.entries(groupedTokens).map(([groupName, tokens]) => {
          const keys = tokens.map(([k]) => k);
          const groupHasOverride = keys.some((k) =>
            Object.prototype.hasOwnProperty.call(overrides, k),
          );
          return (
            <fieldset key={groupName} className="space-y-2" aria-label={groupName}>
              <legend className="flex items-center gap-2 font-semibold">
                {groupName}
                {groupHasOverride && (
                  <Button type="button" onClick={handleGroupReset(keys)}>
                    Reset {groupName}
                  </Button>
                )}
              </legend>
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
                    />
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
