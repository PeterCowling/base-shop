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
      setImportError("Invalid JSON");
      return;
    }
    const ok = importPresets(importText);
    if (!ok) {
      setImportError("Invalid preset format");
      return;
    }
    setImportOpen(false);
    setImportText("");
  }, [importPresets, importText]);

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Style preset"
        className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
        onChange={(event) => onApplyPreset(event.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          Presets
        </option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Custom preset"
        className="rounded border border-border-2 bg-surface-2 px-2 py-1 text-sm"
        onChange={(event) => onApplyCustomPreset(event.target.value)}
        value={selectedCustom}
      >
        <option value="">Custom…</option>
        {customPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" onClick={onCopy} aria-label="Copy styles">
        Copy
      </Button>
      <Button type="button" variant="outline" onClick={onPaste} aria-label="Paste styles">
        Paste
      </Button>
      <Button type="button" variant="outline" onClick={onSavePreset} aria-label="Save custom effects preset">
        Save preset
      </Button>
      <Button type="button" variant="outline" onClick={onRenamePreset} aria-label="Rename selected custom preset" disabled={!selectedCustom}>
        Rename
      </Button>
      <Button type="button" variant="outline" onClick={onDuplicatePreset} aria-label="Duplicate selected custom preset" disabled={!selectedCustom}>
        Duplicate
      </Button>
      <Button type="button" variant="outline" onClick={() => onMovePreset("up")} aria-label="Move selected preset up" disabled={!selectedCustom || !canMoveUp}>
        Up
      </Button>
      <Button type="button" variant="outline" onClick={() => onMovePreset("down")} aria-label="Move selected preset down" disabled={!selectedCustom || !canMoveDown}>
        Down
      </Button>
      <Button type="button" variant="outline" onClick={onRemovePreset} aria-label="Delete selected custom preset" disabled={!selectedCustom}>
        Delete
      </Button>
      <Button type="button" variant="outline" onClick={() => openExport(false)} aria-label="Export custom presets JSON">
        Export all
      </Button>
      <Button type="button" variant="outline" onClick={() => openExport(true)} aria-label="Export selected custom preset" disabled={!selectedCustom}>
        Export selected
      </Button>
      <Button type="button" variant="outline" onClick={() => setImportOpen(true)} aria-label="Import custom presets JSON">
        Import
      </Button>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export custom presets</DialogTitle>
          </DialogHeader>
          <Textarea value={exportText} readOnly rows={10} />
          <DialogFooter>
            <div className="mr-auto text-xs text-muted-foreground">{copied ? "Copied" : ""}</div>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleCopyExport}>
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import custom presets</DialogTitle>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportError("");
            }}
            rows={10}
            placeholder="Paste presets JSON here"
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
              Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={!importText.trim()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
