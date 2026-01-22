import { useCallback, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

import type { CustomPreset } from "../style/customPresets";

type MoveDirection = "up" | "down";

type EffectPreset = {
  id: string;
  label: string;
  value: Partial<StyleOverrides>;
};

interface PresetManagerProps {
  presets: ReadonlyArray<EffectPreset>;
  customPresets: CustomPreset[];
  selectedCustom: string;
  onApplyPreset: (presetId: string) => void;
  onApplyCustomPreset: (presetId: string) => void;
  onCopy: () => void;
  onPaste: () => void;
  onSavePreset: () => void;
  onRenamePreset: () => void;
  onDuplicatePreset: () => void;
  onMovePreset: (dir: MoveDirection) => void;
  onRemovePreset: () => void;
  exportAllPresets: () => string;
  importPresets: (json: string) => boolean;
}

export default function PresetManager({
  presets,
  customPresets,
  selectedCustom,
  onApplyPreset,
  onApplyCustomPreset,
  onCopy,
  onPaste,
  onSavePreset,
  onRenamePreset,
  onDuplicatePreset,
  onMovePreset,
  onRemovePreset,
  exportAllPresets,
  importPresets,
}: PresetManagerProps) {
  const t = useTranslations();
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const selectedIndex = customPresets.findIndex((preset) => preset.id === selectedCustom);
  const canMoveUp = selectedIndex > 0;
  const canMoveDown = selectedIndex > -1 && selectedIndex < customPresets.length - 1;

  const openExport = useCallback(
    (onlySelected: boolean) => {
      if (onlySelected && selectedCustom) {
        const preset = customPresets.find((p) => p.id === selectedCustom);
        setExportText(JSON.stringify(preset ? [preset] : [], null, 2));
      } else {
        const json = exportAllPresets();
        setExportText(json);
      }
      setExportOpen(true);
    },
    [customPresets, exportAllPresets, selectedCustom],
  );

  const handleCopyExport = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore clipboard errors
    }
  }, [exportText]);

  const handleImport = useCallback(() => {
    setImportError("");
    try {
      JSON.parse(importText);
    } catch {
      setImportError(t("cms.style.customPresets.import.invalidJson"));
      return;
    }
    const ok = importPresets(importText);
    if (!ok) {
      setImportError(t("cms.style.customPresets.import.invalidPreset"));
      return;
    }
    setImportOpen(false);
    setImportText("");
  }, [importPresets, importText, t]);

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={t("cms.style.effectPresets.selectAria")}
        className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
        onChange={(event) => onApplyPreset(event.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          {t("cms.style.effectPresets.placeholder")}
        </option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <select
        aria-label={t("cms.style.customPresets.selectAria")}
        className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
        onChange={(event) => onApplyCustomPreset(event.target.value)}
        value={selectedCustom}
      >
        <option value="">{t("cms.style.customPresets.placeholder")}</option>
        {customPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" onClick={onCopy} aria-label={t("cms.style.copyStyles.aria")}>
        {t("actions.copy")}
      </Button>
      <Button type="button" variant="outline" onClick={onPaste} aria-label={t("cms.style.pasteStyles.aria")}>
        {t("actions.paste")}
      </Button>
      <Button type="button" variant="outline" onClick={onSavePreset} aria-label={t("cms.style.customPresets.saveAria")}>
        {t("cms.style.customPresets.save")}
      </Button>
      <Button type="button" variant="outline" onClick={onRenamePreset} aria-label={t("cms.style.customPresets.renameAria")} disabled={!selectedCustom}>
        {t("actions.rename")}
      </Button>
      <Button type="button" variant="outline" onClick={onDuplicatePreset} aria-label={t("cms.style.customPresets.duplicateAria")} disabled={!selectedCustom}>
        {t("actions.duplicate")}
      </Button>
      <Button type="button" variant="outline" onClick={() => onMovePreset("up")} aria-label={t("cms.style.customPresets.moveUpAria")} disabled={!selectedCustom || !canMoveUp}>
        {t("actions.up")}
      </Button>
      <Button type="button" variant="outline" onClick={() => onMovePreset("down")} aria-label={t("cms.style.customPresets.moveDownAria")} disabled={!selectedCustom || !canMoveDown}>
        {t("actions.down")}
      </Button>
      <Button type="button" variant="outline" onClick={onRemovePreset} aria-label={t("cms.style.customPresets.deleteAria")} disabled={!selectedCustom}>
        {t("actions.delete")}
      </Button>
      <Button type="button" variant="outline" onClick={() => openExport(false)} aria-label={t("cms.style.customPresets.exportAllAria")}>
        {t("cms.style.customPresets.exportAll")}
      </Button>
      <Button type="button" variant="outline" onClick={() => openExport(true)} aria-label={t("cms.style.customPresets.exportSelectedAria")} disabled={!selectedCustom}>
        {t("cms.style.customPresets.exportSelected")}
      </Button>
      <Button type="button" variant="outline" onClick={() => setImportOpen(true)} aria-label={t("cms.style.customPresets.importAria")}>
        {t("actions.import")}
      </Button>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("cms.style.customPresets.exportTitle")}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t("cms.style.customPresets.exportAllAria")}
            </p>
          </DialogHeader>
          <Textarea value={exportText} readOnly rows={10} />
          <DialogFooter>
            <div className="me-auto text-xs text-muted-foreground">{copied ? t("actions.copied") : ""}</div>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
              {t("actions.close")}
            </Button>
            <Button type="button" onClick={handleCopyExport}>
              {t("actions.copy")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("cms.style.customPresets.importTitle")}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t("cms.style.customPresets.importPlaceholder")}
            </p>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportError("");
            }}
            rows={10}
            placeholder={t("cms.style.customPresets.importPlaceholder")}
          />
          {importError ? (
            <p className="text-danger text-xs" role="alert">
              {importError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImportOpen(false);
                setImportError("");
              }}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleImport} disabled={!importText.trim()}>
              {t("actions.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
