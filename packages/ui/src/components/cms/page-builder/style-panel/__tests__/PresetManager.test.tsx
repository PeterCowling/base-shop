// packages/ui/src/components/cms/page-builder/style-panel/__tests__/PresetManager.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PresetManager from "../PresetManager";

const presets = [
  { id: "p1", label: "Fade In", value: {} },
  { id: "p2", label: "Slide Up", value: {} },
] as const;

const customPresets = [
  { id: "c1", label: "My One", value: {} },
  { id: "c2", label: "My Two", value: {} },
];

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
