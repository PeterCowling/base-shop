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
import { Input } from "../../../atoms/shadcn";

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
  const effLocked = (editorFlags?.locked ?? component.locked ?? false) as boolean;
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

      {/* Anchor control: assign an element id for scroll-to targets */}
      <div className="mt-2 border-t pt-2">
        {/* i18n-exempt: Builder control label */}
        <div className="text-xs font-semibold text-muted-foreground">Anchor</div>
        <Input
          // i18n-exempt: Field label in builder
          label="Anchor ID"
          // i18n-exempt: Example hint for editors
          placeholder="e.g. section-about"
          value={(
            ("anchorId" in component
              ? (component as unknown as { anchorId?: string }).anchorId
              : undefined) ?? ""
          )}
          onChange={(e) => {
            // sanitize to valid id-like string (letters, numbers, - _)
            const raw = e.target.value;
            const trimmed = raw.trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9_-]/g, "");
            (e.target as HTMLInputElement).value = raw; // keep user's text while storing sanitized
            // Pass through with local loosening to avoid explicit any
            (handleInput as unknown as (field: string, value: unknown) => void)(
              "anchorId",
              (trimmed || undefined) as unknown,
            );
          }}
        />
        {/* i18n-exempt: Short instructional hint for editors */}
        <div className="mt-1 text-xs text-muted-foreground">Use with Click Action → Scroll to by linking to #your-id.</div>
      </div>
    </div>
  );
}
