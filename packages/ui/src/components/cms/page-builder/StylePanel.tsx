// packages/ui/src/components/cms/page-builder/StylePanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { Button, Textarea, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../atoms/shadcn";
import { useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n";
import useContrastWarnings from "../../../hooks/useContrastWarnings";
import { getStyleClipboard, setStyleClipboard } from "./style/styleClipboard";
import { defaultEffectPresets } from "./style/effectPresets";
import useCustomPresets from "./style/useCustomPresets";
import PresetGallery from "./PresetGallery";
import EffectsEditor from "./EffectsEditor";
import StylePreviewCard from "./StylePreviewCard";
import ColorEditor from "./ColorEditor";
import TypographyEditor from "./TypographyEditor";
import usePreviewTokens from "./hooks/usePreviewTokens";
import { applyTextThemeToOverrides, extractTextThemes, matchTextTheme } from "./textThemes";

const parseStyleOverrides = (styles: PageComponent["styles"]): StyleOverrides => {
  if (!styles) return {};
  try {
    return JSON.parse(String(styles)) as StyleOverrides;
  } catch {
    return {};
  }
};

type OverrideSections = {
  color: NonNullable<StyleOverrides["color"]>;
  typography: NonNullable<StyleOverrides["typography"]>;
  typographyDesktop: NonNullable<StyleOverrides["typographyDesktop"]>;
  typographyTablet: NonNullable<StyleOverrides["typographyTablet"]>;
  typographyMobile: NonNullable<StyleOverrides["typographyMobile"]>;
  effects: NonNullable<StyleOverrides["effects"]>;
};

const ensureSection = <T extends object>(value: T | undefined): T =>
  (value ? value : ({} as T));

const pickSections = (overrides: StyleOverrides): OverrideSections => ({
  color: ensureSection(overrides.color),
  typography: ensureSection(overrides.typography),
  typographyDesktop: ensureSection(overrides.typographyDesktop),
  typographyTablet: ensureSection(overrides.typographyTablet),
  typographyMobile: ensureSection(overrides.typographyMobile),
  effects: ensureSection(overrides.effects),
});

type TrackFn = (name: string, payload?: Record<string, unknown>) => void;
let track: TrackFn = () => {};

import("@acme/telemetry")
  .then((m) => {
    track = m.track;
  })
  .catch(() => {
    // telemetry is optional in tests
  });

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K]
  ) => void;
}

export default function StylePanel({ component, handleInput }: Props) {
  const overrides = parseStyleOverrides(component.styles);
  const { color, typography, typographyDesktop, typographyTablet, typographyMobile, effects } =
    pickSections(overrides);
  const warning = useContrastWarnings(color.fg ?? "", color.bg ?? "");
  const t = useTranslations();
  const previewTokens = usePreviewTokens();
  const textThemes = useMemo(() => extractTextThemes(previewTokens), [previewTokens]);
  const appliedTextTheme = useMemo(
    () => matchTextTheme(overrides, textThemes) ?? "",
    [overrides, textThemes],
  );
  const getLatestSections = () => pickSections(parseStyleOverrides(component.styles));

  const _clipboard = { get: getStyleClipboard, set: setStyleClipboard } as const;
  const presets = defaultEffectPresets;
  const {
    customPresets,
    selectedCustom,
    setSelectedCustom,
    saveCurrentAsPreset,
    removeSelected,
    renameSelected,
    duplicateSelected,
    moveSelected,
    exportJSON,
    importJSON,
  } = useCustomPresets(effects);

  const update = (group: "color" | "typography", key: string, value: string) => {
    const latest = getLatestSections();
    const next: StyleOverrides = {
      color: { ...latest.color },
      typography: { ...latest.typography },
    };
    if (group === "color") {
      next.color = { ...latest.color, [key]: value };
    } else {
      next.typography = { ...latest.typography, [key]: value };
    }
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:update", { group, key });
  };

  const updateBp = (
    bp: "Desktop" | "Tablet" | "Mobile",
    key: "fontSize" | "lineHeight",
    value: string,
  ) => {
    const latest = getLatestSections();
    const next: StyleOverrides = {
      color: { ...latest.color },
      typography: { ...latest.typography },
      typographyDesktop: { ...latest.typographyDesktop },
      typographyTablet: { ...latest.typographyTablet },
      typographyMobile: { ...latest.typographyMobile },
    };
    const field = `typography${bp}` as const;
    (next as any)[field] = { ...(next as any)[field], [key]: value };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:update", { group: `typography-${bp.toLowerCase()}` as string, key });
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const latest = getLatestSections();
    const next: StyleOverrides = {
      color: { ...latest.color, ...(preset.value.color ?? {}) },
      typography: { ...latest.typography, ...(preset.value.typography ?? {}) },
      typographyDesktop: { ...latest.typographyDesktop },
      typographyTablet: { ...latest.typographyTablet },
      typographyMobile: { ...latest.typographyMobile },
      effects: { ...latest.effects },
    };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:preset", { id: presetId });
  };

  const copyStyles = () => {
    const latest = getLatestSections();
    const toCopy: StyleOverrides = {
      color: { ...latest.color },
      typography: { ...latest.typography },
      typographyDesktop: { ...latest.typographyDesktop },
      typographyTablet: { ...latest.typographyTablet },
      typographyMobile: { ...latest.typographyMobile },
      effects: { ...latest.effects },
    };
    _clipboard.set(toCopy);
    track("stylepanel:copy");
  };

  const applyCustomPreset = (presetId: string) => {
    const preset = customPresets.find((p) => p.id === presetId);
    if (!preset) return;
    const latest = getLatestSections();
    const next: StyleOverrides = {
      color: { ...latest.color },
      typography: { ...latest.typography },
      typographyDesktop: { ...latest.typographyDesktop },
      typographyTablet: { ...latest.typographyTablet },
      typographyMobile: { ...latest.typographyMobile },
      effects: { ...latest.effects, ...(preset.value.effects ?? {}) },
    };
    handleInput("styles", JSON.stringify(next));
    setSelectedCustom(presetId);
    track("stylepanel:apply-custom-preset", { id: presetId });
  };

  const pasteStyles = () => {
    const data = _clipboard.get();
    if (!data) return;
    const latest = getLatestSections();
    const next: StyleOverrides = {
      color: { ...latest.color, ...(data.color ?? {}) },
      typography: { ...latest.typography, ...(data.typography ?? {}) },
      typographyDesktop: { ...latest.typographyDesktop, ...(data.typographyDesktop ?? {}) },
      typographyTablet: { ...latest.typographyTablet, ...(data.typographyTablet ?? {}) },
      typographyMobile: { ...latest.typographyMobile, ...(data.typographyMobile ?? {}) },
      effects: { ...latest.effects, ...(data.effects ?? {}) },
    };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:paste");
  };

  const updateEffects = (key: keyof NonNullable<StyleOverrides["effects"]>, value: string) => {
    const latest = getLatestSections();
    const next: StyleOverrides = {
      color: { ...latest.color },
      typography: { ...latest.typography },
      typographyDesktop: { ...latest.typographyDesktop },
      typographyTablet: { ...latest.typographyTablet },
      typographyMobile: { ...latest.typographyMobile },
      effects: { ...latest.effects, [key]: value },
    };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:update", { group: "effects", key });
  };

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleTextThemeChange = (themeId: string) => {
    const theme = textThemes.find((entry) => entry.id === themeId) ?? null;
    const current = parseStyleOverrides(component.styles);
    const next = applyTextThemeToOverrides(current, theme);
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:text-theme", { id: theme ? theme.id : "custom" });
  };

  const openExport = (onlySelected = false) => {
    if (onlySelected && selectedCustom) {
      const one = customPresets.find((p) => p.id === selectedCustom);
      setExportText(JSON.stringify(one ? [one] : [], null, 2));
    } else {
      const json = exportJSON();
      setExportText(json);
    }
    setExportOpen(true);
  };
  const doCopyExport = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* noop */ }
  };
  const doImport = () => {
    setImportError("");
    try { JSON.parse(importText); } catch { setImportError("Invalid JSON"); return; }
    const ok = importJSON(importText);
    if (!ok) { setImportError("Invalid preset format"); return; }
    setImportOpen(false);
    setImportText("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          aria-label="Style preset"
          className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
          onChange={(e) => applyPreset(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Presets
          </option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Custom preset"
          className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
          onChange={(e) => applyCustomPreset(e.target.value)}
          value={selectedCustom}
        >
          <option value="">Custom…</option>
          {customPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={copyStyles} aria-label="Copy styles">Copy</Button>
        <Button type="button" variant="outline" onClick={pasteStyles} aria-label="Paste styles">Paste</Button>
        <Button type="button" variant="outline" onClick={() => saveCurrentAsPreset()} aria-label="Save custom effects preset">Save preset</Button>
        <Button type="button" variant="outline" onClick={renameSelected} aria-label="Rename selected custom preset" disabled={!selectedCustom}>Rename</Button>
        <Button type="button" variant="outline" onClick={duplicateSelected} aria-label="Duplicate selected custom preset" disabled={!selectedCustom}>Duplicate</Button>
        <Button type="button" variant="outline" onClick={() => moveSelected('up')} aria-label="Move selected preset up" disabled={!selectedCustom || customPresets.findIndex(p => p.id === selectedCustom) <= 0}>Up</Button>
        <Button type="button" variant="outline" onClick={() => moveSelected('down')} aria-label="Move selected preset down" disabled={!selectedCustom || customPresets.findIndex(p => p.id === selectedCustom) === customPresets.length - 1}>Down</Button>
        <Button type="button" variant="outline" onClick={removeSelected} aria-label="Delete selected custom preset" disabled={!selectedCustom}>Delete</Button>
        <Button type="button" variant="outline" onClick={() => openExport(false)} aria-label="Export custom presets JSON">Export all</Button>
        <Button type="button" variant="outline" onClick={() => openExport(true)} aria-label="Export selected custom preset" disabled={!selectedCustom}>Export selected</Button>
        <Button type="button" variant="outline" onClick={() => setImportOpen(true)} aria-label="Import custom presets JSON">Import</Button>
      </div>
      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export custom presets</DialogTitle>
          </DialogHeader>
          <Textarea value={exportText} readOnly rows={10} />
          <DialogFooter>
            <div className="mr-auto text-xs text-muted-foreground">{copied ? "Copied" : ""}</div>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>Close</Button>
            <Button type="button" onClick={doCopyExport}>Copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import custom presets</DialogTitle>
          </DialogHeader>
          <Textarea value={importText} onChange={(e) => { setImportText(e.target.value); setImportError(""); }} rows={10} placeholder="Paste presets JSON here" />
          {importError ? (<p className="text-danger text-xs" role="alert">{importError}</p>) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setImportOpen(false); setImportError(""); }}>Cancel</Button>
            <Button type="button" onClick={doImport} disabled={!importText.trim()}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PresetGallery title="Quick presets" presets={presets} onApply={applyPreset} />
      <PresetGallery title="Custom presets" presets={customPresets} onApply={applyCustomPreset} />
      <StylePreviewCard
        effects={effects}
        hoverScale={(component as any).hoverScale as number | undefined}
        hoverOpacity={(component as any).hoverOpacity as number | undefined}
      />
      <ColorEditor
        values={{ fg: color.fg, bg: color.bg, border: color.border }}
        labels={{ fg: t("cms.style.foreground") as string, bg: t("cms.style.background") as string, border: t("cms.style.border") as string }}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(key, value) => update('color', key, value)}
      />

      {textThemes.length > 0 && (
        <div>
          <label
            htmlFor={`text-theme-${component.id}`}
            className="text-xs font-semibold text-muted-foreground"
          >
            Text Style
          </label>
          <select
            id={`text-theme-${component.id}`}
            className="mt-1 w-full rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
            value={appliedTextTheme}
            onChange={(e) => handleTextThemeChange(e.target.value)}
          >
            <option value="">Custom</option>
            {textThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <TypographyEditor
        base={typography}
        desktop={typographyDesktop}
        tablet={typographyTablet}
        mobile={typographyMobile}
        labels={{
          base: {
            fontFamily: t("cms.style.fontFamily") as string,
            fontSize: t("cms.style.fontSize") as string,
            fontWeight: t("cms.style.fontWeight") as string,
            lineHeight: t("cms.style.lineHeight") as string,
          },
          desktop: { heading: "Typography (Desktop)", fontSize: "Font size (Desktop)", lineHeight: "Line height (Desktop)" },
          tablet: { heading: "Typography (Tablet)", fontSize: "Font size (Tablet)", lineHeight: "Line height (Tablet)" },
          mobile: { heading: "Typography (Mobile)", fontSize: "Font size (Mobile)", lineHeight: "Line height (Mobile)" },
        }}
        onBase={(key, value) => update('typography', key, value)}
        onBp={(bp, key, value) => updateBp(bp, key, value)}
      />
      {/* Effects */}
      <div className="mt-3 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Effects</div>
        <EffectsEditor effects={effects} onChange={updateEffects} />
      </div>
      {warning && (
        <p role="status" aria-live="polite" className="text-danger text-sm">
          {t("cms.style.lowContrast")}
        </p>
      )}
    </div>
  );
}
