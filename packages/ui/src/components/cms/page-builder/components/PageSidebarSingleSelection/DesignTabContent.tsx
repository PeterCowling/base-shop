import type { HistoryState, PageComponent } from "@acme/types";
import type { EditorFlags } from "../../panels/layout/types";

import LayoutPanel from "../../panels/LayoutPanel";
import StylePanel from "../../StylePanel";
import type { HandleFieldInput } from "./types";

interface DesignTabContentProps {
  component: PageComponent;
  handleFieldInput: HandleFieldInput;
  handleResizeField: (field: string, value: string) => void;
  handleFullSizeField: (field: string) => void;
  editorFlags: NonNullable<HistoryState["editor"]>[string] | undefined;
  editorMap: HistoryState["editor"] | undefined;
  onUpdateEditor: (patch: Partial<EditorFlags>) => void;
  updateEditorForId: (id: string, patch: Partial<EditorFlags>) => void;
}

const DesignTabContent = ({
  component,
  handleFieldInput,
  handleResizeField,
  handleFullSizeField,
  editorFlags,
  editorMap,
  onUpdateEditor,
  updateEditorForId,
}: DesignTabContentProps) => (
  <div className="space-y-3">
    <LayoutPanel
      component={component}
      handleInput={handleFieldInput}
      handleResize={handleResizeField}
      handleFullSize={handleFullSizeField}
      editorFlags={editorFlags as unknown as EditorFlags}
      onUpdateEditor={onUpdateEditor}
      editorMap={editorMap}
      updateEditorForId={updateEditorForId}
    />
    <StylePanel component={component} handleInput={handleFieldInput} />
  </div>
);

export default DesignTabContent;
