import type { HistoryState, PageComponent } from "@acme/types";

import LayoutPanel from "../../panels/LayoutPanel";
import StylePanel from "../../StylePanel";
import type { HandleFieldInput } from "./types";

interface DesignTabContentProps {
  component: PageComponent;
  handleFieldInput: HandleFieldInput;
  handleResizeField: (field: string, value: string) => void;
  handleFullSizeField: (field: string) => void;
  editorFlags: HistoryState["editor"][string] | undefined;
  editorMap: HistoryState["editor"] | undefined;
  onUpdateEditor: (patch: any) => void;
  updateEditorForId: (id: string, patch: any) => void;
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
      editorFlags={editorFlags as any}
      onUpdateEditor={onUpdateEditor}
      editorMap={editorMap}
      updateEditorForId={updateEditorForId}
    />
    <StylePanel component={component} handleInput={handleFieldInput} />
  </div>
);

export default DesignTabContent;
