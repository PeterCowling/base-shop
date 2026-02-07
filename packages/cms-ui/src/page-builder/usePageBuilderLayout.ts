// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";

import type { CSSProperties } from "react";
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type Locale, locales } from "@acme/i18n/locales";
import { scaffoldPageFromTemplate, type TemplateDescriptor } from "@acme/page-builder-core";
import type { HistoryState, Page, PageComponent } from "@acme/types";

import { buildCanvasProps, buildGridProps, buildHistoryProps, buildPreviewProps, buildTourProps } from "./buildProps";
import { createLinkedSectionHandler } from "./createLinkedSectionHandler";
import { createToolbarProps } from "./createToolbarProps";
import type { ComponentType } from "./defaults";
import useFileDrop from "./hooks/useFileDrop";
import useGridSize from "./hooks/useGridSize";
import useLayerSelectionPreference from "./hooks/useLayerSelectionPreference";
import useLocalStrings from "./hooks/useLocalStrings";
import usePageBuilderControls from "./hooks/usePageBuilderControls";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePresetActions from "./hooks/usePresetActions";
import usePreviewTokens from "./hooks/usePreviewTokens";
import type { PageBuilderLayoutProps, PageBuilderProps } from "./PageBuilder.types";
import type { EditorFlags } from "./state/layout/types";
import { computeRevisionId } from "./state/revision";
import TemplateActions from "./TemplateActions";
import useDnDSetup from "./usePageBuilderLayout/useDnDSetup";
import useInsertSetup from "./usePageBuilderLayout/useInsertSetup";
import useSavePublish from "./usePageBuilderLayout/useSavePublish";
// single-purpose helpers
import useShop from "./usePageBuilderLayout/useShop";
import useSectionModeInitialSelection from "./useSectionModeInitialSelection";

function resolveLocales({
  seoTitle,
  primaryLocale,
  locale,
}: {
  seoTitle: Record<string, unknown>;
  primaryLocale?: Locale;
  locale?: Locale;
}) {
  const resolvedPrimaryLocale: Locale =
    primaryLocale ??
    ((Object.keys(seoTitle).find((key) => {
      const val = seoTitle[key as keyof typeof seoTitle];
      return typeof val === "string" && val.trim().length > 0;
    }) as Locale | undefined) ??
      (locales[0] as Locale));
  const resolvedLocale: Locale = locale ?? resolvedPrimaryLocale;
  return { resolvedPrimaryLocale, resolvedLocale };
}

const hasSeoKeys = (value?: Record<string, string>) => Boolean(value && Object.keys(value).length > 0);
const hasSeoValues = (value?: Record<string, string>) =>
  Boolean(value && Object.values(value).some((entry) => Boolean(entry)));

function mergeSeo({
  nextSeo,
  pageSeo,
}: {
  nextSeo: Page["seo"];
  pageSeo: Page["seo"] | undefined;
}) {
  return {
    ...nextSeo,
    title: hasSeoKeys(pageSeo?.title) ? pageSeo?.title ?? {} : nextSeo.title,
    description: hasSeoValues(pageSeo?.description) ? pageSeo?.description ?? {} : nextSeo.description ?? {},
    image: hasSeoKeys(pageSeo?.image) ? pageSeo?.image ?? {} : nextSeo.image ?? {},
    noindex: pageSeo?.noindex ?? nextSeo.noindex,
  };
}

function buildTemplatePageWithMeta({
  template,
  pageMeta,
  shop,
  resolvedLocale,
  resolvedPrimaryLocale,
}: {
  template: TemplateDescriptor;
  pageMeta: Page;
  shop: string | null | undefined;
  resolvedLocale: Locale;
  resolvedPrimaryLocale: Locale;
}): Page {
  const next = scaffoldPageFromTemplate(template, {
    shopId: shop ?? "",
    locale: resolvedLocale,
    primaryLocale: resolvedPrimaryLocale,
  });
  const nextSeo = mergeSeo({ nextSeo: next.seo, pageSeo: pageMeta.seo });
  return {
    ...next,
    id: pageMeta.id,
    slug: pageMeta.slug ?? "",
    status: pageMeta.status ?? next.status,
    visibility: (pageMeta as { visibility?: Page["visibility"] }).visibility ?? next.visibility,
    createdAt: pageMeta.createdAt ?? next.createdAt,
    updatedAt: pageMeta.updatedAt ?? next.updatedAt,
    createdBy: pageMeta.createdBy ?? next.createdBy,
    seo: nextSeo,
  };
}

function buildLayoutReturn({
  style,
  handleAddFromPalette,
  handleInsertImageAsset,
  handleSetSectionBackground,
  selectedIsSection,
  handleInsertPreset,
  handleInsertLinkedSection,
  presetsSourceUrl,
  toolbarProps,
  gridProps,
  controls,
  toggleComments,
  showComments,
  liveMessage,
  dndContext,
  dropAllowed,
  pageMeta,
  currentRevisionId,
  dragMeta,
  canvasProps,
  insertParentId,
  parentFirst,
  activeType,
  previewProps,
  historyProps,
  handleRevert,
  components,
  selectedIds,
  dispatch,
  setSelectedIds,
  state,
  scrollRef,
  toastProps,
  tourProps,
  setParentFirst,
  shop,
  canSavePreset,
  onSavePreset,
  templateActions,
  allowedTypes,
  setEditingSizePx,
  previewUrl,
  previewSource,
  mode,
}: {
  style: CSSProperties | undefined;
  handleAddFromPalette: PageBuilderLayoutProps["paletteOnAdd"];
  handleInsertImageAsset: PageBuilderLayoutProps["onInsertImageAsset"];
  handleSetSectionBackground: PageBuilderLayoutProps["onSetSectionBackground"];
  selectedIsSection: boolean;
  handleInsertPreset: PageBuilderLayoutProps["onInsertPreset"];
  handleInsertLinkedSection: PageBuilderLayoutProps["onInsertLinkedSection"];
  presetsSourceUrl?: string;
  toolbarProps: PageBuilderLayoutProps["toolbarProps"];
  gridProps: PageBuilderLayoutProps["gridProps"];
  controls: ReturnType<typeof usePageBuilderControls>;
  toggleComments: () => void;
  showComments: boolean;
  liveMessage: string | null;
  dndContext: PageBuilderLayoutProps["dndContext"];
  dropAllowed: boolean | null;
  pageMeta: Page;
  currentRevisionId: string;
  dragMeta: ReturnType<typeof useDnDSetup>["dragMeta"];
  canvasProps: PageBuilderLayoutProps["canvasProps"];
  insertParentId: string | null;
  parentFirst: boolean;
  activeType: string | null;
  previewProps: ReturnType<typeof buildPreviewProps>;
  historyProps: PageBuilderLayoutProps["historyProps"];
  handleRevert: (nextComponents: PageComponent[]) => Promise<void> | void;
  components: PageComponent[];
  selectedIds: string[];
  dispatch: ReturnType<typeof usePageBuilderState>["dispatch"];
  setSelectedIds: (ids: string[]) => void;
  state: ReturnType<typeof usePageBuilderState>["state"];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  toastProps: PageBuilderLayoutProps["toast"];
  tourProps: PageBuilderLayoutProps["tourProps"];
  setParentFirst: (value: boolean) => void;
  shop: string | null | undefined;
  canSavePreset: boolean;
  onSavePreset: () => void;
  templateActions: React.ReactNode;
  allowedTypes: Set<ComponentType> | undefined;
  setEditingSizePx: (value: number | null) => void;
  previewUrl?: string | null;
  previewSource?: PageBuilderProps["previewSource"];
  mode: PageBuilderProps["mode"] | undefined;
}): PageBuilderLayoutProps {
  return {
    style,
    paletteOnAdd: handleAddFromPalette,
    onInsertImageAsset: handleInsertImageAsset,
    onSetSectionBackground: handleSetSectionBackground,
    selectedIsSection,
    onInsertPreset: handleInsertPreset,
    onInsertLinkedSection: handleInsertLinkedSection,
    presetsSourceUrl,
    toolbarProps,
    gridProps,
    startTour: controls.startTour,
    togglePreview: controls.togglePreview,
    showPreview: controls.showPreview,
    toggleComments,
    showComments,
    liveMessage,
    dndContext,
    dropAllowed,
    publishMeta: {
      status: pageMeta.status,
      updatedAt: pageMeta.updatedAt,
      publishedAt: (pageMeta as { publishedAt?: string }).publishedAt,
      publishedBy: (pageMeta as { publishedBy?: string }).publishedBy,
      publishedRevisionId: (pageMeta as { publishedRevisionId?: string }).publishedRevisionId,
      currentRevisionId,
      lastPublishedComponents: (pageMeta as { lastPublishedComponents?: PageComponent[] }).lastPublishedComponents,
    },
    previewUrl: previewUrl ?? null,
    previewSource: previewSource ?? null,
    dragMeta: dragMeta ? { from: dragMeta.from, type: dragMeta.type, count: dragMeta.count, label: dragMeta.label, thumbnail: dragMeta.thumbnail ?? null } : null,
    frameClass: controls.frameClass,
    viewport: controls.viewport,
    viewportStyle: controls.viewportStyle,
    zoom: controls.zoom,
    scrollRef,
    canvasProps: {
      ...canvasProps,
      dropAllowed,
      insertParentId,
      preferParentOnClick: parentFirst,
    },
    activeType,
    previewProps,
    historyProps: {
      ...historyProps,
      onRevertToPublished: handleRevert,
      lastPublishedComponents: (pageMeta as { lastPublishedComponents?: PageComponent[] }).lastPublishedComponents,
    },
    sidebarProps: {
      components,
      selectedIds,
      onSelectIds: setSelectedIds,
      dispatch,
      editor: (state as { editor?: HistoryState["editor"] }).editor,
      viewport: controls.viewport,
      breakpoints: Array.isArray((state as Record<string, unknown>)["breakpoints"])
        ? ((state as Record<string, unknown>)["breakpoints"] as { id: string; label: string; min?: number; max?: number }[])
        : [],
      pageId: pageMeta.id,
      crossNotices: controls.crossBreakpointNotices,
    },
    toast: toastProps,
    tourProps,
    parentFirst,
    onParentFirstChange: setParentFirst,
    shop,
    pageId: pageMeta.id,
    editingSizePx: controls.editingSizePx ?? null,
    setEditingSizePx,
    crossBreakpointNotices: controls.crossBreakpointNotices,
    onCrossBreakpointNoticesChange: controls.setCrossBreakpointNotices,
    mode,
    canSavePreset,
    onSavePreset,
    templateActions,
    allowedBlockTypes: allowedTypes,
  } as PageBuilderLayoutProps;
}

function useLayoutInteractions({
  components,
  dispatch,
  selectedIds,
  setSelectedIds,
  gridSize,
  canvasRef,
  setSnapPosition,
  state,
  controls,
  scrollRef,
  t,
}: {
  components: PageComponent[];
  dispatch: ReturnType<typeof usePageBuilderState>["dispatch"];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  gridSize: ReturnType<typeof useGridSize>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setSnapPosition: (value: number | null) => void;
  state: ReturnType<typeof usePageBuilderState>["state"];
  controls: ReturnType<typeof usePageBuilderControls>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  t: ReturnType<typeof useLocalStrings>;
}) {
  const { dndContext, insertIndex, insertParentId, activeType, dropAllowed, dragMeta } = useDnDSetup({
    components,
    dispatch,
    selectId: (id: string) => setSelectedIds([id]),
    gridSize,
    canvasRef,
    setSnapPosition,
    editor: (state as { editor?: HistoryState["editor"] }).editor,
    viewport: controls.viewport,
    scrollRef,
    zoom: controls.zoom,
    t,
  });

  const {
    selectedIsSection,
    handleAddFromPalette,
    handleInsertImageAsset,
    handleSetSectionBackground,
    handleInsertPreset,
  } = useInsertSetup({ components, selectedIds, setSelectedIds, insertIndex, insertParentId, dispatch, t });

  return {
    dndContext,
    insertIndex,
    insertParentId,
    activeType,
    dropAllowed,
    dragMeta,
    selectedIsSection,
    handleAddFromPalette,
    handleInsertImageAsset,
    handleSetSectionBackground,
    handleInsertPreset,
  };
}

function buildLayoutProps({
  controls,
  selectedIds,
  state,
  dispatch,
  shop,
  progress,
  isValid,
  setSelectedIds,
  pagesNav,
  components,
  canvasRef,
  dragOver,
  setDragOver,
  handleFileDrop,
  insertIndex,
  previewTokens,
  snapPosition,
  locale,
  showComments,
  zoom,
  historyPropsInput,
  tourSteps,
  runTour,
  handleTourCallback,
}: {
  controls: ReturnType<typeof usePageBuilderControls>;
  selectedIds: string[];
  state: ReturnType<typeof usePageBuilderState>["state"];
  dispatch: ReturnType<typeof usePageBuilderState>["dispatch"];
  setSelectedIds: (ids: string[]) => void;
  shop: string | null | undefined;
  progress: ReturnType<typeof useFileDrop>["progress"];
  isValid: boolean | null;
  pagesNav: PageBuilderProps["pagesNav"];
  components: PageComponent[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
  dragOver: boolean;
  setDragOver: (value: boolean) => void;
  handleFileDrop: ReturnType<typeof useFileDrop>["handleFileDrop"];
  insertIndex: number | null;
  previewTokens: ReturnType<typeof usePreviewTokens>;
  snapPosition: number | null;
  locale: Locale;
  showComments: boolean;
  zoom: number;
  historyPropsInput: ReturnType<typeof buildHistoryInput>;
  tourSteps: ReturnType<typeof usePageBuilderControls>["tourSteps"];
  runTour: ReturnType<typeof usePageBuilderControls>["runTour"];
  handleTourCallback: ReturnType<typeof usePageBuilderControls>["handleTourCallback"];
}) {
  const toolbarProps = createToolbarProps({
    controls,
    selectedIds,
    state,
    dispatch,
    shop,
    progress,
    isValid,
    locales,
    pagesNav,
  });

  const gridProps = buildGridProps({
    showGrid: controls.showGrid,
    toggleGrid: controls.toggleGrid,
    snapToGrid: controls.snapToGrid,
    toggleSnap: controls.toggleSnap,
    gridCols: controls.gridCols,
    setGridCols: controls.setGridCols,
    zoom: controls.zoom,
    setZoom: controls.setZoom,
    showRulers: controls.showRulers,
    toggleRulers: controls.toggleRulers,
    showBaseline: controls.showBaseline,
    toggleBaseline: controls.toggleBaseline,
    baselineStep: controls.baselineStep,
    setBaselineStep: controls.setBaselineStep,
  });

  const canvasProps = buildCanvasProps({
    components,
    selectedIds,
    onSelectIds: setSelectedIds,
    canvasRef,
    dragOver,
    setDragOver,
    onFileDrop: handleFileDrop,
    insertIndex,
    dispatch,
    locale,
    containerStyle: { width: "100%", ...(previewTokens as unknown as CSSProperties) },
    showGrid: controls.showGrid,
    gridCols: controls.gridCols,
    snapEnabled: controls.snapToGrid,
    showRulers: controls.showRulers,
    viewport: controls.viewport,
    device: controls.device,
    snapPosition,
    editor: (state as { editor?: HistoryState["editor"] }).editor,
    shop,
    pageId: historyPropsInput.pageId,
    showComments,
    zoom,
    showBaseline: controls.showBaseline,
    baselineStep: controls.baselineStep,
  });

  const previewProps = buildPreviewProps({
    components,
    locale,
    deviceId: controls.previewDeviceId,
    onChange: controls.setPreviewDeviceId,
    editor: (state as { editor?: HistoryState["editor"] }).editor,
    extraDevices: controls.extraDevices,
  });

  const historyProps = buildHistoryProps(historyPropsInput);

  const tourProps = buildTourProps({
    steps: tourSteps,
    run: runTour,
    callback: handleTourCallback,
  });

  return { toolbarProps, gridProps, canvasProps, previewProps, historyProps, tourProps };
}

function buildLayoutPropsFromState({
  controls,
  selectedIds,
  state,
  dispatch,
  shop,
  progress,
  isValid,
  setSelectedIds,
  pagesNav,
  components,
  canvasRef,
  dragOver,
  setDragOver,
  handleFileDrop,
  insertIndex,
  previewTokens,
  snapPosition,
  showComments,
  historyPropsInput,
}: {
  controls: ReturnType<typeof usePageBuilderControls>;
  selectedIds: string[];
  state: ReturnType<typeof usePageBuilderState>["state"];
  dispatch: ReturnType<typeof usePageBuilderState>["dispatch"];
  shop: string | null | undefined;
  progress: ReturnType<typeof useFileDrop>["progress"];
  isValid: boolean | null;
  setSelectedIds: (ids: string[]) => void;
  pagesNav: PageBuilderProps["pagesNav"];
  components: PageComponent[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
  dragOver: boolean;
  setDragOver: (value: boolean) => void;
  handleFileDrop: ReturnType<typeof useFileDrop>["handleFileDrop"];
  insertIndex: number | null;
  previewTokens: ReturnType<typeof usePreviewTokens>;
  snapPosition: number | null;
  showComments: boolean;
  historyPropsInput: ReturnType<typeof buildHistoryInput>;
}) {
  return buildLayoutProps({
    controls,
    selectedIds,
    state,
    dispatch,
    shop,
    progress,
    setSelectedIds,
    isValid,
    pagesNav,
    components,
    canvasRef,
    dragOver,
    setDragOver,
    handleFileDrop,
    insertIndex,
    previewTokens,
    snapPosition,
    locale: controls.locale,
    showComments,
    zoom: controls.zoom,
    historyPropsInput,
    tourSteps: controls.tourSteps,
    runTour: controls.runTour,
    handleTourCallback: controls.handleTourCallback,
  });
}

function buildHistoryInput({
  state,
  dispatch,
  handleSave,
  publishWithValidation,
  saving,
  publishing,
  saveError,
  publishError,
  autoSaveState,
  shop,
  pageMeta,
  components,
  handleRevert,
}: {
  state: ReturnType<typeof usePageBuilderState>["state"];
  dispatch: ReturnType<typeof usePageBuilderState>["dispatch"];
  handleSave: () => void;
  publishWithValidation: () => void;
  saving: boolean;
  publishing: boolean;
  saveError: PageBuilderProps["saveError"];
  publishError: PageBuilderProps["publishError"];
  autoSaveState: ReturnType<typeof useSavePublish>["autoSaveState"];
  shop: string | null | undefined;
  pageMeta: Page;
  components: PageComponent[];
  handleRevert: (nextComponents: PageComponent[]) => Promise<void> | void;
}) {
  return {
    canUndo: !!state.past.length,
    canRedo: !!state.future.length,
    onUndo: () => dispatch({ type: "undo" }),
    onRedo: () => dispatch({ type: "redo" }),
    onSave: handleSave,
    onPublish: publishWithValidation,
    saving,
    publishing,
    saveError,
    publishError,
    autoSaveState,
    shop,
    pageId: pageMeta.id,
    currentComponents: components,
    editor: (state as Record<string, unknown> & { editor?: Record<string, EditorFlags> }).editor,
    onRestoreVersion: (restored: PageComponent[]) => {
      dispatch({ type: "set", components: restored });
      handleSave();
    },
    lastPublishedComponents: (pageMeta as { lastPublishedComponents?: PageComponent[] }).lastPublishedComponents,
    onRevertToPublished: handleRevert,
  };
}

function useRevisionId(components: PageComponent[]) {
  return useMemo(() => {
    try {
      return computeRevisionId(components);
    } catch {
      return "rev-unknown";
    }
  }, [components]);
}

function useTemplateActions({
  templates,
  pageMeta,
  components,
  shop,
  resolvedLocale,
  resolvedPrimaryLocale,
  dispatch,
  setPageMeta,
  setToast,
  t,
}: {
  templates: PageBuilderProps["templates"];
  pageMeta: Page;
  components: PageComponent[];
  shop: string | null | undefined;
  resolvedLocale: Locale;
  resolvedPrimaryLocale: Locale;
  dispatch: ReturnType<typeof usePageBuilderState>["dispatch"];
  setPageMeta: React.Dispatch<React.SetStateAction<Page>>;
  setToast: ReturnType<typeof useSavePublish>["setToast"];
  t: ReturnType<typeof useLocalStrings>;
}) {
  const buildTemplatePage = useCallback(
    (template: TemplateDescriptor): Page => {
      return buildTemplatePageWithMeta({
        template,
        pageMeta,
        shop,
        resolvedLocale,
        resolvedPrimaryLocale,
      });
    },
    [pageMeta, resolvedLocale, resolvedPrimaryLocale, shop],
  );

  const currentPage = useMemo<Page>(
    () => ({
      ...pageMeta,
      components,
    }),
    [pageMeta, components],
  );

  const applyTemplate = useCallback(
    async (template: TemplateDescriptor, nextPage: Page) => {
      dispatch({ type: "set", components: nextPage.components as PageComponent[] });
      setPageMeta((prev) => ({
        ...prev,
        stableId: template.id,
        components: nextPage.components,
        seo: nextPage.seo ?? prev.seo,
      }));
      const appliedMessage = t("cms.builder.templates.applied");
      setToast({
        open: true,
        message: appliedMessage,
      });
    },
    [dispatch, setPageMeta, setToast, t],
  );

  return useMemo(() => {
    const templateList = templates ?? [];
    if (templateList.length === 0) {
      return undefined;
    }

    return createElement(TemplateActions, {
      templates: templateList,
      currentPage,
      buildTemplatePage,
      onApply: applyTemplate,
    });
  }, [applyTemplate, buildTemplatePage, currentPage, templates]);
}

function useLayoutState({
  page,
  history,
  onChange,
  shop,
}: {
  page: Page;
  history: PageBuilderProps["history"];
  onChange: PageBuilderProps["onChange"];
  shop: string | null | undefined;
}) {
  const [pageMeta, setPageMeta] = useState(page);

  useEffect(() => {
    setPageMeta(page);
  }, [page]);

  const saveRef = useRef<() => void>(() => {});
  const togglePreviewRef = useRef<() => void>(() => {});
  const rotateDeviceRef = useRef<(direction: "left" | "right") => void>(() => {});

  const {
    state,
    components,
    dispatch,
    selectedIds,
    setSelectedIds,
    liveMessage,
    clearHistory,
  } = usePageBuilderState({
    page,
    history,
    onChange,
    onSaveShortcut: () => saveRef.current(),
    onTogglePreview: () => togglePreviewRef.current(),
    onRotateDevice: (direction) => rotateDeviceRef.current(direction),
  });

  const controls = usePageBuilderControls({ state, dispatch });
  togglePreviewRef.current = controls.togglePreview;
  rotateDeviceRef.current = controls.rotateDevice;

  const { dragOver, setDragOver, handleFileDrop, progress, isValid } = useFileDrop({
    shop: shop ?? "",
    dispatch,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [snapPosition, setSnapPosition] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(true);

  const previewTokens = usePreviewTokens();
  const t = useLocalStrings(controls.locale);
  const gridSize = useGridSize(canvasRef, {
    showGrid: controls.showGrid,
    gridCols: controls.gridCols,
    deviceKey: `${controls.deviceId}:${controls.orientation}`,
  });

  return {
    pageMeta,
    setPageMeta,
    saveRef,
    togglePreviewRef,
    rotateDeviceRef,
    state,
    components,
    dispatch,
    selectedIds,
    setSelectedIds,
    liveMessage,
    clearHistory,
    controls,
    dragOver,
    setDragOver,
    handleFileDrop,
    progress,
    isValid,
    canvasRef,
    scrollRef,
    snapPosition,
    setSnapPosition,
    showComments,
    setShowComments,
    previewTokens,
    t,
    gridSize,
  };
}

function useLayoutExtras({
  mode,
  components,
  selectedIds,
  dispatch,
  setSelectedIds,
  shop,
  setToast,
  allowedBlockTypes,
  locale,
  primaryLocale,
  pageMeta,
  templates,
  setPageMeta,
  t,
  setShowComments,
}: {
  mode: PageBuilderProps["mode"];
  components: PageComponent[];
  selectedIds: string[];
  dispatch: ReturnType<typeof usePageBuilderState>["dispatch"];
  setSelectedIds: (ids: string[]) => void;
  shop: string | null | undefined;
  setToast: ReturnType<typeof useSavePublish>["setToast"];
  allowedBlockTypes: PageBuilderProps["allowedBlockTypes"];
  locale: PageBuilderProps["locale"];
  primaryLocale: PageBuilderProps["primaryLocale"];
  pageMeta: Page;
  templates: PageBuilderProps["templates"];
  setPageMeta: React.Dispatch<React.SetStateAction<Page>>;
  t: ReturnType<typeof useLocalStrings>;
  setShowComments: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { parentFirst, setParentFirst } = useLayerSelectionPreference();
  const toggleComments = useCallback(() => setShowComments((value) => !value), [setShowComments]);

  const resolvedMode = mode ?? "page";
  useSectionModeInitialSelection({ mode: resolvedMode, components, setSelectedIds });

  const handleInsertLinkedSection = createLinkedSectionHandler({
    shop,
    components,
    selectedIds,
    dispatch,
    setSelectedIds,
  });

  const { canSavePreset, onSavePreset } = usePresetActions({
    shop,
    components,
    selectedIds,
    setToast,
  });

  const allowedTypes = useMemo(
    () => (Array.isArray(allowedBlockTypes) ? new Set(allowedBlockTypes) : undefined),
    [allowedBlockTypes],
  );

  const seoTitle = pageMeta.seo?.title ?? {};
  const { resolvedPrimaryLocale, resolvedLocale } = resolveLocales({
    seoTitle,
    primaryLocale: primaryLocale as Locale | undefined,
    locale: locale as Locale | undefined,
  });

  const currentRevisionId = useRevisionId(components);
  const templateActions = useTemplateActions({
    templates,
    pageMeta,
    components,
    shop,
    resolvedLocale,
    resolvedPrimaryLocale,
    dispatch,
    setPageMeta,
    setToast,
    t,
  });

  return {
    parentFirst,
    setParentFirst,
    toggleComments,
    handleInsertLinkedSection,
    canSavePreset,
    onSavePreset,
    allowedTypes,
    currentRevisionId,
    templateActions,
  };
}

const usePageBuilderLayout = ({
  page,
  history: historyProp,
  onSave,
  onPublish,
  saving = false,
  publishing = false,
  saveError,
  publishError,
  onChange,
  style,
  presetsSourceUrl,
  pagesNav,
  mode = "page",
  previewUrl,
  previewSource,
  locale,
  primaryLocale,
  templates,
  allowedBlockTypes,
  shopId,
}: PageBuilderProps): PageBuilderLayoutProps => {
  const derivedShop = useShop();
  const shop = shopId ?? derivedShop;
  const {
    pageMeta, setPageMeta, saveRef, togglePreviewRef, rotateDeviceRef, state, components,
    dispatch, selectedIds, setSelectedIds, liveMessage, clearHistory, controls, dragOver,
    setDragOver, handleFileDrop, progress, isValid, canvasRef, scrollRef, snapPosition,
    setSnapPosition, showComments, setShowComments, previewTokens, t, gridSize,
  } = useLayoutState({
    page,
    history: historyProp,
    onChange,
    shop,
  });
  const {
    dndContext, insertIndex, insertParentId, activeType, dropAllowed, dragMeta, selectedIsSection,
    handleAddFromPalette, handleInsertImageAsset, handleSetSectionBackground, handleInsertPreset,
  } = useLayoutInteractions({
    components,
    dispatch,
    selectedIds,
    setSelectedIds,
    gridSize,
    canvasRef,
    setSnapPosition,
    state,
    controls,
    scrollRef,
    t,
  });
  const { handleSave, publishWithValidation, autoSaveState, toastProps, setToast, handleRevert } = useSavePublish({
    page: pageMeta,
    components,
    state,
    onSave,
    onPublish,
    shop,
    clearHistory,
    t,
    rotateDevice: (direction) => rotateDeviceRef.current(direction),
    togglePreview: () => togglePreviewRef.current(),
  });
  saveRef.current = handleSave;
  const historyPropsInput = buildHistoryInput({
    state,
    dispatch,
    handleSave,
    publishWithValidation,
    saving,
    publishing,
    saveError,
    publishError,
    autoSaveState,
    shop,
    pageMeta,
    components,
    handleRevert,
  });
  const { toolbarProps, gridProps, canvasProps, previewProps, historyProps, tourProps } = buildLayoutPropsFromState({
    controls,
    selectedIds,
    state,
    dispatch,
    setSelectedIds,
    shop,
    progress,
    isValid,
    pagesNav,
    components,
    canvasRef,
    dragOver,
    setDragOver,
    handleFileDrop,
    insertIndex,
    previewTokens,
    snapPosition,
    showComments,
    historyPropsInput,
  });
  const {
    parentFirst,
    setParentFirst,
    toggleComments,
    handleInsertLinkedSection,
    canSavePreset,
    onSavePreset,
    allowedTypes,
    currentRevisionId,
    templateActions,
  } = useLayoutExtras({
    mode,
    components,
    selectedIds,
    dispatch,
    setSelectedIds,
    shop,
    setToast,
    allowedBlockTypes,
    locale,
    primaryLocale,
    templates,
    pageMeta,
    setPageMeta,
    t,
    setShowComments,
  });
  const paletteHandlers = {
    handleAddFromPalette,
    handleInsertImageAsset,
    handleSetSectionBackground,
    selectedIsSection,
    handleInsertPreset,
    handleInsertLinkedSection,
    presetsSourceUrl: presetsSourceUrl ?? process.env.NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL,
  };
  return buildLayoutReturn({
    style,
    ...paletteHandlers,
    toolbarProps,
    gridProps,
    controls,
    toggleComments,
    showComments,
    liveMessage,
    dndContext,
    dropAllowed,
    dragMeta,
    pageMeta,
    currentRevisionId,
    canvasProps,
    insertParentId: insertParentId ?? null,
    parentFirst,
    activeType,
    previewProps,
    historyProps,
    handleRevert,
    components,
    selectedIds,
    dispatch,
    setSelectedIds,
    state,
    scrollRef,
    toastProps,
    tourProps,
    setParentFirst,
    shop,
    canSavePreset,
    onSavePreset,
    templateActions,
    allowedTypes,
    setEditingSizePx: controls.setEditingSizePx,
    previewUrl,
    previewSource,
    mode,
  });
};

export default usePageBuilderLayout;
