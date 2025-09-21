"use client";

import type { PageComponent, HistoryState } from "@acme/types";
import type { EditorFlags } from "./layout/types";
import ZIndexControls from "./layout/ZIndexControls";
import SizeControls from "./layout/SizeControls";
import PositionControls from "./layout/PositionControls";
import StackingControls from "./layout/StackingControls";
import SpacingControls from "./layout/SpacingControls";
import TabSlotControl from "./layout/TabSlotControl";
import SectionSettings from "./layout/SectionSettings";
import GridPlacementControls from "./layout/GridPlacementControls";
import ContainerQueryControls from "./layout/ContainerQueryControls";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => void;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
  editorFlags?: EditorFlags;
  onUpdateEditor?: (patch: Partial<EditorFlags>) => void;
  editorMap?: HistoryState["editor"];
  updateEditorForId?: (id: string, patch: Partial<EditorFlags>) => void;
}

export default function LayoutPanel({
  component,
  handleInput,
  handleResize,
  handleFullSize,
  editorFlags,
  onUpdateEditor,
  editorMap,
  updateEditorForId,
}: Props) {
  const effLocked = ((editorFlags as any)?.locked ?? (component as any)?.locked ?? false) as boolean;
  return (
    <div className="space-y-2">
      <ZIndexControls locked={effLocked} editorFlags={editorFlags} onUpdateEditor={onUpdateEditor} />

      <SizeControls component={component} locked={effLocked} handleResize={handleResize} handleFullSize={handleFullSize} />

      <PositionControls component={component} locked={effLocked} handleInput={handleInput} handleResize={handleResize} />

      <StackingControls component={component} editorFlags={editorFlags} onUpdateEditor={onUpdateEditor} editorMap={editorMap} updateEditorForId={updateEditorForId} />

      <SpacingControls component={component} handleInput={handleInput} handleResize={handleResize} />

      <TabSlotControl component={component} handleInput={handleInput} />

      <SectionSettings component={component} locked={effLocked} handleInput={handleInput} handleResize={handleResize} />

      <GridPlacementControls component={component} handleInput={handleInput} />

      <ContainerQueryControls component={component} handleInput={handleInput} />
    </div>
  );
}
