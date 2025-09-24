"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import type { Action } from "../state";
import useGlobals from "../hooks/useGlobals";
import useStyleClipboardActions from "../hooks/useStyleClipboardActions";
import useCenterInParent from "../hooks/useCenterInParent";
import useGroupingActions from "../hooks/useGroupingActions";
import useLibraryActions from "../hooks/useLibraryActions";
import useBlockDimensions from "../useBlockDimensions";
import usePreviewTokens from "../hooks/usePreviewTokens";
import { extractTextThemes, applyTextThemeToOverrides } from "../textThemes";
import VisibilityToggles from "./VisibilityToggles";
import AnimationTabContent from "./PageSidebarSingleSelection/AnimationTabContent";
import CenterInParentActionButtons from "./PageSidebarSingleSelection/CenterInParentActionButtons";
import CenterInParentButtons from "./PageSidebarSingleSelection/CenterInParentButtons";
import CmsTabContent from "./PageSidebarSingleSelection/CmsTabContent";
import ContentTabContent from "./PageSidebarSingleSelection/ContentTabContent";
import DesignTabContent from "./PageSidebarSingleSelection/DesignTabContent";
import DimensionInputs from "./PageSidebarSingleSelection/DimensionInputs";
import DuplicateButton from "./PageSidebarSingleSelection/DuplicateButton";
import GlobalActions from "./PageSidebarSingleSelection/GlobalActions";
import LinkedGlobalNotice from "./PageSidebarSingleSelection/LinkedGlobalNotice";
import MultiSelectionAlignmentControls from "./PageSidebarSingleSelection/MultiSelectionAlignmentControls";
import SaveToLibraryButton from "./PageSidebarSingleSelection/SaveToLibraryButton";
import SingleSelectionAlignmentControls from "./PageSidebarSingleSelection/SingleSelectionAlignmentControls";
import StyleClipboardActions from "./PageSidebarSingleSelection/StyleClipboardActions";
import TabSwitcher from "./PageSidebarSingleSelection/TabSwitcher";
import UngroupButton from "./PageSidebarSingleSelection/UngroupButton";
import type { HandleFieldInput, HandleResize, UpdateComponent, Viewport } from "./PageSidebarSingleSelection/types";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport: Viewport;
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
  selectedComponent: PageComponent;
  pageId?: string | null;
}

const PageSidebarSingleSelection = ({
  components,
  selectedIds,
  dispatch,
  editor,
  viewport,
  breakpoints = [],
  selectedComponent,
  pageId,
}: Props) => {
  const previewTokens = usePreviewTokens();
  const textThemes = useMemo(() => extractTextThemes(previewTokens), [previewTokens]);
  const {
    globals,
    insertOpen,
    setInsertOpen,
    insertSearch,
    setInsertSearch,
    makeGlobal,
    editGlobally,
    insertGlobal,
  } = useGlobals({ components, editor, dispatch, selectedComponent, pageId });
  const { copyStyles, pasteStyles } = useStyleClipboardActions({ selectedComponent, selectedIds, components, dispatch });
  const { centerInParentX, centerInParentY } = useCenterInParent({ components, selectedIds, editor, dispatch, viewport });
  const { ungroup } = useGroupingActions({ components, selectedIds, dispatch });
  const { saveSelectionToLibrary } = useLibraryActions({ components, selectedIds });
  const dims = useBlockDimensions({ component: selectedComponent, viewport });
  const [tab, setTab] = useState<"design" | "anim" | "content" | "cms">("design");

  const handleDuplicate = useCallback(() => {
    selectedIds.forEach((id) => dispatch({ type: "duplicate", id }));
    try {
      window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block duplicated" }));
    } catch {
      // no-op
    }
  }, [dispatch, selectedIds]);

  const handleChange = useCallback<UpdateComponent>(
    (patch) => {
      if (!selectedIds[0]) return;
      dispatch({ type: "update", id: selectedIds[0], patch });
    },
    [dispatch, selectedIds],
  );

  const handleResize = useCallback<HandleResize>(
    (size) => {
      if (!selectedIds[0]) return;
      dispatch({ type: "resize", id: selectedIds[0], ...size });
    },
    [dispatch, selectedIds],
  );

  const handleFieldInput = useCallback<HandleFieldInput>(
    (field, value) => {
      handleChange({ [field]: value } as any);
    },
    [handleChange],
  );

  const hasChildren = useMemo(() => {
    const c = selectedComponent as any;
    return !!(c && c.children && Array.isArray(c.children) && c.children.length > 0);
  }, [selectedComponent]);

  const eid = (editor ?? {})[selectedComponent.id] as any;
  const gid = eid?.global?.id as string | undefined;
  const linkedGlobalLabel = useMemo(() => {
    if (!gid) return null;
    const g = globals.find((x) => x.globalId === gid) || null;
    return g?.label || gid;
  }, [gid, globals]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (!detail?.id) return;
      if (selectedIds.length !== 1) {
        try {
          window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Select a block to apply text style" }));
        } catch {
          // no-op
        }
        return;
      }
      const theme = textThemes.find((t) => t.id === detail.id);
      if (!theme) return;
      let overrides: StyleOverrides = {};
      try {
        overrides = (selectedComponent as any).styles
          ? (JSON.parse(String((selectedComponent as any).styles)) as StyleOverrides)
          : {};
      } catch {
        overrides = {};
      }
      const next = applyTextThemeToOverrides(overrides, theme);
      handleChange({ styles: JSON.stringify(next) } as any);
      try {
        window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `${theme.label} text style applied` }));
      } catch {
        // no-op
      }
    };
    window.addEventListener("pb:apply-text-theme", handler as EventListener);
    return () => window.removeEventListener("pb:apply-text-theme", handler as EventListener);
  }, [handleChange, selectedComponent, selectedIds, textThemes]);

  useEffect(() => {
    if (!eid?.global?.pinned) return;

    const otherPinned = Object.entries(editor ?? {}).filter(
      ([id, flags]) => id !== selectedComponent.id && Boolean((flags as any)?.global?.pinned),
    );

    if (otherPinned.length === 0) return;

    otherPinned.forEach(([id, flags]) => {
      const otherGlobal = (flags as any)?.global;
      if (!otherGlobal) return;

      const nextGlobal = { ...otherGlobal, pinned: false };
      dispatch({ type: "update-editor", id, patch: { global: nextGlobal } as any });
    });
  }, [dispatch, editor, selectedComponent.id, eid?.global?.pinned]);

  const handleResizeField = useCallback(
    (field: string, value: string) => handleResize({ [field]: value }),
    [handleResize],
  );

  const handleFullSizeField = useCallback((field: string) => handleResize({ [field]: "100%" }), [handleResize]);

  const handleUpdateEditor = useCallback(
    (patch: Partial<HistoryState["editor"][string]>) => {
      if (!selectedIds[0]) return;
      dispatch({ type: "update-editor", id: selectedIds[0], patch } as any);
    },
    [dispatch, selectedIds],
  );

  const updateEditorForId = useCallback(
    (id: string, patch: Partial<HistoryState["editor"][string]>) => {
      dispatch({ type: "update-editor", id, patch } as any);
    },
    [dispatch],
  );

  const unlinkFromGlobal = useCallback(() => {
    dispatch({ type: "update-editor", id: selectedComponent.id, patch: { global: undefined } as any });
  }, [dispatch, selectedComponent.id]);

  const showUngroup = selectedIds.length === 1 && hasChildren;

  return (
    <div className="space-y-2">
      {selectedIds.length === 1 && (
        <>
          <SingleSelectionAlignmentControls
            selectedIds={selectedIds}
            dims={dims}
            handleChange={handleChange}
            handleResize={handleResize}
            centerInParentX={centerInParentX}
            centerInParentY={centerInParentY}
          />
          <CenterInParentButtons onCenterX={centerInParentX} onCenterY={centerInParentY} />
        </>
      )}
      <MultiSelectionAlignmentControls
        components={components}
        selectedIds={selectedIds}
        viewport={viewport}
        dispatch={dispatch}
      />
      <DimensionInputs dims={dims} selectedComponentId={selectedComponent.id} handleResize={handleResize} />
      <TabSwitcher value={tab} onChange={(value) => setTab(value)} />
      <LinkedGlobalNotice globalId={gid} linkedLabel={linkedGlobalLabel} onEditGlobally={editGlobally} onUnlink={unlinkFromGlobal} />
      <DuplicateButton onDuplicate={handleDuplicate} />
      <GlobalActions
        globals={globals}
        insertOpen={insertOpen}
        setInsertOpen={setInsertOpen}
        insertSearch={insertSearch}
        setInsertSearch={setInsertSearch}
        insertGlobal={insertGlobal}
        makeGlobal={makeGlobal}
        editGlobally={editGlobally}
      />
      <StyleClipboardActions onCopy={copyStyles} onPaste={pasteStyles} />
      <VisibilityToggles selectedIds={selectedIds} editor={editor} dispatch={dispatch} breakpoints={breakpoints} />
      <UngroupButton show={showUngroup} onUngroup={ungroup} />
      <SaveToLibraryButton onSave={saveSelectionToLibrary} />
      <CenterInParentActionButtons onCenterX={centerInParentX} onCenterY={centerInParentY} />
      {tab === "design" && (
        <DesignTabContent
          component={selectedComponent}
          handleFieldInput={handleFieldInput}
          handleResizeField={handleResizeField}
          handleFullSizeField={handleFullSizeField}
          editorFlags={editor?.[selectedComponent.id]}
          editorMap={editor}
          onUpdateEditor={handleUpdateEditor}
          updateEditorForId={updateEditorForId}
        />
      )}
      {tab === "anim" && <AnimationTabContent component={selectedComponent} handleFieldInput={handleFieldInput} />}
      {tab === "content" && (
        <ContentTabContent component={selectedComponent} handleFieldInput={handleFieldInput} onChange={handleChange} />
      )}
      {tab === "cms" && <CmsTabContent component={selectedComponent} onChange={handleChange} />}
    </div>
  );
};

export default PageSidebarSingleSelection;
