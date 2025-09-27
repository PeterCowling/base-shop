import { useCallback, useState } from "react";
import { Button, Textarea, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../atoms/shadcn";
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
      setImportError(/* i18n-exempt */ "Invalid JSON");
      return;
    }
    const ok = importPresets(importText);
    if (!ok) {
      setImportError(/* i18n-exempt */ "Invalid preset format");
      return;
    }
    setImportOpen(false);
    setImportText("");
  }, [importPresets, importText]);

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={/* i18n-exempt — editor-only control label */ "Style preset"}
        className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
        onChange={(event) => onApplyPreset(event.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          {/* i18n-exempt */}Presets
        </option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <select
        aria-label={/* i18n-exempt — editor-only control label */ "Custom preset"}
        className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
        onChange={(event) => onApplyCustomPreset(event.target.value)}
        value={selectedCustom}
      >
        <option value="">{/* i18n-exempt */}Custom…</option>
        {customPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" onClick={onCopy} aria-label={/* i18n-exempt */ "Copy styles"}>
        {/* i18n-exempt */}Copy
      </Button>
      <Button type="button" variant="outline" onClick={onPaste} aria-label={/* i18n-exempt */ "Paste styles"}>
        {/* i18n-exempt */}Paste
      </Button>
      <Button type="button" variant="outline" onClick={onSavePreset} aria-label={/* i18n-exempt */ "Save custom effects preset"}>
        {/* i18n-exempt */}Save preset
      </Button>
      <Button type="button" variant="outline" onClick={onRenamePreset} aria-label={/* i18n-exempt */ "Rename selected custom preset"} disabled={!selectedCustom}>
        {/* i18n-exempt */}Rename
      </Button>
      <Button type="button" variant="outline" onClick={onDuplicatePreset} aria-label={/* i18n-exempt */ "Duplicate selected custom preset"} disabled={!selectedCustom}>
        {/* i18n-exempt */}Duplicate
      </Button>
      <Button type="button" variant="outline" onClick={() => onMovePreset("up")} aria-label={/* i18n-exempt */ "Move selected preset up"} disabled={!selectedCustom || !canMoveUp}>
        {/* i18n-exempt */}Up
      </Button>
      <Button type="button" variant="outline" onClick={() => onMovePreset("down")} aria-label={/* i18n-exempt */ "Move selected preset down"} disabled={!selectedCustom || !canMoveDown}>
        {/* i18n-exempt */}Down
      </Button>
      <Button type="button" variant="outline" onClick={onRemovePreset} aria-label={/* i18n-exempt */ "Delete selected custom preset"} disabled={!selectedCustom}>
        {/* i18n-exempt */}Delete
      </Button>
      <Button type="button" variant="outline" onClick={() => openExport(false)} aria-label={/* i18n-exempt */ "Export custom presets JSON"}>
        {/* i18n-exempt */}Export all
      </Button>
      <Button type="button" variant="outline" onClick={() => openExport(true)} aria-label={/* i18n-exempt */ "Export selected custom preset"} disabled={!selectedCustom}>
        {/* i18n-exempt */}Export selected
      </Button>
      <Button type="button" variant="outline" onClick={() => setImportOpen(true)} aria-label={/* i18n-exempt */ "Import custom presets JSON"}>
        {/* i18n-exempt */}Import
      </Button>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{/* i18n-exempt */}Export custom presets</DialogTitle>
          </DialogHeader>
          <Textarea value={exportText} readOnly rows={10} />
          <DialogFooter>
            <div className="me-auto text-xs text-muted-foreground">{copied ? (/* i18n-exempt */ "Copied") : ""}</div>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
              {/* i18n-exempt */}Close
            </Button>
            <Button type="button" onClick={handleCopyExport}>
              {/* i18n-exempt */}Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{/* i18n-exempt */}Import custom presets</DialogTitle>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportError("");
            }}
            rows={10}
            placeholder={/* i18n-exempt */ "Paste presets JSON here"}
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
              {/* i18n-exempt */}Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={!importText.trim()}>
              {/* i18n-exempt */}Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
