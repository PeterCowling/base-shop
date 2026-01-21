// packages/ui/src/components/cms/page-builder/style-panel/__tests__/PresetManager.test.tsx
import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import PresetManager from "../PresetManager";

const presets = [
  { id: "p1", label: "Fade In", value: {} },
  { id: "p2", label: "Slide Up", value: {} },
] as const;

const customPresets = [
  { id: "c1", label: "My One", value: {} },
  { id: "c2", label: "My Two", value: {} },
];

// Minimal i18n mock so aria-labels and button text resolve to human-readable strings
const translations: Record<string, string> = {
  "cms.style.effectPresets.selectAria": "Style preset",
  "cms.style.customPresets.selectAria": "Custom preset",
  "cms.style.copyStyles.aria": "Copy styles",
  "cms.style.pasteStyles.aria": "Paste styles",
  "cms.style.customPresets.saveAria": "Save custom effects preset",
  "cms.style.customPresets.renameAria": "Rename selected custom preset",
  "cms.style.customPresets.duplicateAria": "Duplicate selected custom preset",
  "cms.style.customPresets.moveUpAria": "Move selected preset up",
  "cms.style.customPresets.moveDownAria": "Move selected preset down",
  "cms.style.customPresets.deleteAria": "Delete selected custom preset",
  "cms.style.customPresets.exportAllAria": "Export custom presets JSON",
  "cms.style.customPresets.exportSelectedAria": "Export selected preset JSON",
  "cms.style.customPresets.exportTitle": "Export presets",
  "cms.style.customPresets.importTitle": "Import presets",
  "cms.style.customPresets.importPlaceholder": "Paste JSON here",
  "cms.style.customPresets.import.invalidJson": "Invalid JSON",
  "cms.style.customPresets.import.invalidPreset": "Invalid preset",
  "actions.copy": "Copy",
  "actions.paste": "Paste",
  "actions.rename": "Rename",
  "actions.duplicate": "Duplicate",
  "actions.up": "Up",
  "actions.down": "Down",
  "actions.delete": "Delete",
  "actions.import": "Import",
  "actions.close": "Close",
  "actions.cancel": "Cancel",
  "actions.copied": "Copied",
};
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string, vars?: Record<string, string | number>) => {
    const msg = translations[key] || key;
    if (!vars) return msg;
    return msg.replace(/\{(.*?)\}/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m
    );
  },
}));

describe("PresetManager", () => {
  beforeAll(() => {
    // Clipboard mock to prevent exceptions
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  test("fires handlers and toggles import/export dialogs", () => {
    const onApplyPreset = jest.fn();
    const onApplyCustomPreset = jest.fn();
    const onCopy = jest.fn();
    const onPaste = jest.fn();
    const onSavePreset = jest.fn();
    const onRenamePreset = jest.fn();
    const onDuplicatePreset = jest.fn();
    const onMovePreset = jest.fn();
    const onRemovePreset = jest.fn();
    const exportAllPresets = jest.fn(() => JSON.stringify(customPresets));
    const importPresets = jest.fn(() => true);

    const { rerender } = render(
      <PresetManager
        presets={presets as any}
        customPresets={customPresets as any}
        selectedCustom="c1"
        onApplyPreset={onApplyPreset}
        onApplyCustomPreset={onApplyCustomPreset}
        onCopy={onCopy}
        onPaste={onPaste}
        onSavePreset={onSavePreset}
        onRenamePreset={onRenamePreset}
        onDuplicatePreset={onDuplicatePreset}
        onMovePreset={onMovePreset}
        onRemovePreset={onRemovePreset}
        exportAllPresets={exportAllPresets}
        importPresets={importPresets}
      />
    );

    // Selects
    fireEvent.change(screen.getByLabelText("Style preset"), { target: { value: "p2" } });
    expect(onApplyPreset).toHaveBeenCalledWith("p2");
    fireEvent.change(screen.getByLabelText("Custom preset"), { target: { value: "c2" } });
    expect(onApplyCustomPreset).toHaveBeenCalledWith("c2");

    // Buttons
    fireEvent.click(screen.getByLabelText("Copy styles"));
    expect(onCopy).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Paste styles"));
    expect(onPaste).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Save custom effects preset"));
    expect(onSavePreset).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Rename selected custom preset"));
    expect(onRenamePreset).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Duplicate selected custom preset"));
    expect(onDuplicatePreset).toHaveBeenCalled();
    // Up is disabled for first item; Down is enabled
    const upBtn = screen.getByLabelText("Move selected preset up") as HTMLButtonElement;
    const downBtn = screen.getByLabelText("Move selected preset down") as HTMLButtonElement;
    expect(upBtn.disabled).toBe(true);
    expect(downBtn.disabled).toBe(false);
    fireEvent.click(downBtn);
    expect(onMovePreset).toHaveBeenCalledWith("down");
    // Rerender selecting second item: Up enabled, Down disabled
    onMovePreset.mockClear();
    rerender(
      <PresetManager
        presets={presets as any}
        customPresets={customPresets as any}
        selectedCustom="c2"
        onApplyPreset={onApplyPreset}
        onApplyCustomPreset={onApplyCustomPreset}
        onCopy={onCopy}
        onPaste={onPaste}
        onSavePreset={onSavePreset}
        onRenamePreset={onRenamePreset}
        onDuplicatePreset={onDuplicatePreset}
        onMovePreset={onMovePreset}
        onRemovePreset={onRemovePreset}
        exportAllPresets={exportAllPresets}
        importPresets={importPresets}
      />
    );
    const up2 = screen.getByLabelText("Move selected preset up") as HTMLButtonElement;
    const down2 = screen.getByLabelText("Move selected preset down") as HTMLButtonElement;
    expect(up2.disabled).toBe(false);
    expect(down2.disabled).toBe(true);
    fireEvent.click(up2);
    expect(onMovePreset).toHaveBeenCalledWith("up");
    fireEvent.click(screen.getByLabelText("Delete selected custom preset"));
    expect(onRemovePreset).toHaveBeenCalled();

    // Export buttons are present and wired
    expect(screen.getByLabelText("Export custom presets JSON")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Export custom presets JSON"));
    expect(exportAllPresets).toHaveBeenCalled();
  });
});
