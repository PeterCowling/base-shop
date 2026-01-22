"use client";

import { Input } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { HistoryState,PageComponent } from "@acme/types";

import ContainerQueryControls from "./layout/ContainerQueryControls";
import GridPlacementControls from "./layout/GridPlacementControls";
import PositionControls from "./layout/PositionControls";
import SectionSettings from "./layout/SectionSettings";
import SizeControls from "./layout/SizeControls";
import SpacingControls from "./layout/SpacingControls";
import StackingControls from "./layout/StackingControls";
import TabSlotControl from "./layout/TabSlotControl";
import type { EditorFlags } from "./layout/types";
import ZIndexControls from "./layout/ZIndexControls";

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
  errorKeys?: Set<string>;
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
  errorKeys,
}: Props) {
  const t = useTranslations();
  const effLocked = (editorFlags?.locked ?? component.locked ?? false) as boolean;
  return (
    <div className="space-y-2">
      <ZIndexControls locked={effLocked} editorFlags={editorFlags} onUpdateEditor={onUpdateEditor} />

      <SizeControls component={component} locked={effLocked} handleResize={handleResize} handleFullSize={handleFullSize} errorKeys={errorKeys} />

      <PositionControls component={component} locked={effLocked} handleInput={handleInput} handleResize={handleResize} errorKeys={errorKeys} />

      <StackingControls component={component} editorFlags={editorFlags} onUpdateEditor={onUpdateEditor} editorMap={editorMap} updateEditorForId={updateEditorForId} />

      <SpacingControls component={component} handleInput={handleInput} handleResize={handleResize} errorKeys={errorKeys} />

      <TabSlotControl component={component} handleInput={handleInput} />

      <SectionSettings component={component} locked={effLocked} handleInput={handleInput} handleResize={handleResize} />

      <GridPlacementControls component={component} handleInput={handleInput} />

      <ContainerQueryControls component={component} handleInput={handleInput} />

      {/* Anchor control: assign an element id for scroll-to targets */}
      <div className="mt-2 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">{t("cms.builder.anchor.label")}</div>
        <Input
          label={t("cms.builder.anchor.idLabel") as string}
          placeholder={t("cms.builder.anchor.placeholder") as string}
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
        <div className="mt-1 text-xs text-muted-foreground">{t("cms.builder.anchor.hint")}</div>
      </div>
    </div>
  );
}
