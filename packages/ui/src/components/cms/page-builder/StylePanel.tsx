// packages/ui/src/components/cms/page-builder/StylePanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { Button, Input, Textarea, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../atoms/shadcn";
import { useState } from "react";
import { useTranslations } from "@acme/i18n";
import useContrastWarnings from "../../../hooks/useContrastWarnings";
import { getStyleClipboard, setStyleClipboard } from "./style/styleClipboard";
import { defaultEffectPresets } from "./style/effectPresets";
import useCustomPresets from "./style/useCustomPresets";
import PresetGallery from "./PresetGallery";

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
  const overrides: StyleOverrides = component.styles
    ? JSON.parse(String(component.styles))
    : {};
  const color = overrides.color ?? {};
  const typography = overrides.typography ?? {};
  const typoDesktop = overrides.typographyDesktop ?? {};
  const typoTablet = overrides.typographyTablet ?? {};
  const typoMobile = overrides.typographyMobile ?? {};
  const effects = overrides.effects ?? {};
  const warning = useContrastWarnings(color.fg ?? "", color.bg ?? "");
  const t = useTranslations();

  const _clipboard = { get: getStyleClipboard, set: setStyleClipboard } as const;
  const presets = defaultEffectPresets;
  const {
    customPresets,
    selectedCustom,
    setSelectedCustom,
    saveCurrentAsPreset,
    removeSelected,
    renameSelected,
    exportJSON,
    importJSON,
  } = useCustomPresets(effects);

  const update = (group: "color" | "typography", key: string, value: string) => {
    const next: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
    };
    if (group === "color") {
      next.color = { ...color, [key]: value };
    } else {
      next.typography = { ...typography, [key]: value };
    }
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:update", { group, key });
  };

  const updateBp = (
    bp: "Desktop" | "Tablet" | "Mobile",
    key: "fontSize" | "lineHeight",
    value: string,
  ) => {
    const next: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
      typographyDesktop: { ...typoDesktop },
      typographyTablet: { ...typoTablet },
      typographyMobile: { ...typoMobile },
    };
    const field = `typography${bp}` as const;
    (next as any)[field] = { ...(next as any)[field], [key]: value };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:update", { group: `typography-${bp.toLowerCase()}` as string, key });
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const next: StyleOverrides = {
      color: { ...color, ...(preset.value.color ?? {}) },
      typography: { ...typography, ...(preset.value.typography ?? {}) },
      typographyDesktop: { ...typoDesktop },
      typographyTablet: { ...typoTablet },
      typographyMobile: { ...typoMobile },
      effects: { ...effects },
    };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:preset", { id: presetId });
  };

  const copyStyles = () => {
    const toCopy: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
      typographyDesktop: { ...typoDesktop },
      typographyTablet: { ...typoTablet },
      typographyMobile: { ...typoMobile },
      effects: { ...effects },
    };
    _clipboard.set(toCopy);
    track("stylepanel:copy");
  };

  const applyCustomPreset = (presetId: string) => {
    const preset = customPresets.find((p) => p.id === presetId);
    if (!preset) return;
    const next: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
      typographyDesktop: { ...typoDesktop },
      typographyTablet: { ...typoTablet },
      typographyMobile: { ...typoMobile },
      effects: { ...effects, ...(preset.value.effects ?? {}) },
    };
    handleInput("styles", JSON.stringify(next));
    setSelectedCustom(presetId);
    track("stylepanel:apply-custom-preset", { id: presetId });
  };

  const pasteStyles = () => {
    const data = _clipboard.get();
    if (!data) return;
    const next: StyleOverrides = {
      color: { ...color, ...(data.color ?? {}) },
      typography: { ...typography, ...(data.typography ?? {}) },
      typographyDesktop: { ...typoDesktop, ...(data.typographyDesktop ?? {}) },
      typographyTablet: { ...typoTablet, ...(data.typographyTablet ?? {}) },
      typographyMobile: { ...typoMobile, ...(data.typographyMobile ?? {}) },
      effects: { ...effects, ...(data.effects ?? {}) },
    };
    handleInput("styles", JSON.stringify(next));
    track("stylepanel:paste");
  };

  const updateEffects = (key: keyof NonNullable<StyleOverrides["effects"]>, value: string) => {
    const next: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
      typographyDesktop: { ...typoDesktop },
      typographyTablet: { ...typoTablet },
      typographyMobile: { ...typoMobile },
      effects: { ...effects, [key]: value },
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
          className="rounded border bg-background px-2 py-1 text-sm"
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
          className="rounded border bg-background px-2 py-1 text-sm"
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
        <Button type="button" variant="outline" onClick={removeSelected} aria-label="Delete selected custom preset" disabled={!selectedCustom}>Delete</Button>
        <Button type="button" variant="outline" onClick={openExport} aria-label="Export custom presets JSON">Export</Button>
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
      <Input
        label={t("cms.style.foreground")}
        value={color.fg ?? ""}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(e) => update("color", "fg", e.target.value)}
      />
      <Input
        label={t("cms.style.background")}
        value={color.bg ?? ""}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(e) => update("color", "bg", e.target.value)}
      />
      <Input
        label={t("cms.style.border")}
        value={color.border ?? ""}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(e) => update("color", "border", e.target.value)}
      />
      <Input
        label={t("cms.style.fontFamily")}
        value={typography.fontFamily ?? ""}
        onChange={(e) => update("typography", "fontFamily", e.target.value)}
      />
      <Input
        label={t("cms.style.fontSize")}
        value={typography.fontSize ?? ""}
        onChange={(e) => update("typography", "fontSize", e.target.value)}
      />
      <Input
        label={t("cms.style.fontWeight")}
        value={typography.fontWeight ?? ""}
        onChange={(e) => update("typography", "fontWeight", e.target.value)}
      />
      <Input
        label={t("cms.style.lineHeight")}
        value={typography.lineHeight ?? ""}
        onChange={(e) => update("typography", "lineHeight", e.target.value)}
      />
      {/* Per-breakpoint typography overrides */}
      <div className="mt-3 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Typography (Desktop)</div>
        <Input
          label="Font size (Desktop)"
          value={typoDesktop.fontSize ?? ""}
          onChange={(e) => updateBp("Desktop", "fontSize", e.target.value)}
        />
        <Input
          label="Line height (Desktop)"
          value={typoDesktop.lineHeight ?? ""}
          onChange={(e) => updateBp("Desktop", "lineHeight", e.target.value)}
        />
      </div>
      <div className="border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Typography (Tablet)</div>
        <Input
          label="Font size (Tablet)"
          value={typoTablet.fontSize ?? ""}
          onChange={(e) => updateBp("Tablet", "fontSize", e.target.value)}
        />
        <Input
          label="Line height (Tablet)"
          value={typoTablet.lineHeight ?? ""}
          onChange={(e) => updateBp("Tablet", "lineHeight", e.target.value)}
        />
      </div>
      <div className="border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Typography (Mobile)</div>
        <Input
          label="Font size (Mobile)"
          value={typoMobile.fontSize ?? ""}
          onChange={(e) => updateBp("Mobile", "fontSize", e.target.value)}
        />
        <Input
          label="Line height (Mobile)"
          value={typoMobile.lineHeight ?? ""}
          onChange={(e) => updateBp("Mobile", "lineHeight", e.target.value)}
        />
      </div>
      {/* Effects */}
      <div className="mt-3 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">Effects</div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Border radius" value={effects.borderRadius ?? ""} onChange={(e) => updateEffects("borderRadius", e.target.value)} />
          <Input label="Box shadow" value={effects.boxShadow ?? ""} onChange={(e) => updateEffects("boxShadow", e.target.value)} />
          <Input label="Opacity" value={effects.opacity ?? ""} onChange={(e) => updateEffects("opacity", e.target.value)} placeholder="0..1" />
          <Input label="Backdrop filter" value={effects.backdropFilter ?? ""} onChange={(e) => updateEffects("backdropFilter", e.target.value)} placeholder="e.g. blur(6px)" />
          <Input label="Outline" value={effects.outline ?? ""} onChange={(e) => updateEffects("outline", e.target.value)} placeholder="e.g. 1px solid var(--color-border)" />
          <Input label="Outline offset" value={effects.outlineOffset ?? ""} onChange={(e) => updateEffects("outlineOffset", e.target.value)} />
          <Input label="Border top" value={effects.borderTop ?? ""} onChange={(e) => updateEffects("borderTop", e.target.value)} />
          <Input label="Border right" value={effects.borderRight ?? ""} onChange={(e) => updateEffects("borderRight", e.target.value)} />
          <Input label="Border bottom" value={effects.borderBottom ?? ""} onChange={(e) => updateEffects("borderBottom", e.target.value)} />
          <Input label="Border left" value={effects.borderLeft ?? ""} onChange={(e) => updateEffects("borderLeft", e.target.value)} />
          <Input label="Rotate" value={effects.transformRotate ?? ""} onChange={(e) => updateEffects("transformRotate", e.target.value)} placeholder="e.g. 5deg" />
          <Input label="Scale" value={effects.transformScale ?? ""} onChange={(e) => updateEffects("transformScale", e.target.value)} placeholder="e.g. 1.05" />
          <Input label="Skew X" value={effects.transformSkewX ?? ""} onChange={(e) => updateEffects("transformSkewX", e.target.value)} placeholder="e.g. 5deg" />
          <Input label="Skew Y" value={effects.transformSkewY ?? ""} onChange={(e) => updateEffects("transformSkewY", e.target.value)} placeholder="e.g. 0deg" />
        </div>
      </div>
      {warning && (
        <p role="status" aria-live="polite" className="text-danger text-sm">
          {t("cms.style.lowContrast")}
        </p>
      )}
    </div>
  );
}
