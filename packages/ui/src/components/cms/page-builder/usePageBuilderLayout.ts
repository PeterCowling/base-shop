// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";

import { locales } from "@acme/i18n/locales";
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import useFileDrop from "./hooks/useFileDrop";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderControls from "./hooks/usePageBuilderControls";
import usePreviewTokens from "./hooks/usePreviewTokens";
import useLayerSelectionPreference from "./hooks/useLayerSelectionPreference";
import useLocalStrings from "./hooks/useLocalStrings";
import useGridSize from "./hooks/useGridSize";
import { buildCanvasProps, buildGridProps, buildHistoryProps, buildPreviewProps, buildTourProps } from "./buildProps";
import { createToolbarProps } from "./createToolbarProps";
import { createLinkedSectionHandler } from "./createLinkedSectionHandler";
import useSectionModeInitialSelection from "./useSectionModeInitialSelection";
import type { PageComponent, HistoryState, Page, Locale } from "@acme/types";
import { scaffoldPageFromTemplate, type TemplateDescriptor } from "@acme/page-builder-core";
import type { PageBuilderLayoutProps, PageBuilderProps } from "./PageBuilder.types";
import usePresetActions from "./hooks/usePresetActions";
import TemplateActions from "./TemplateActions";

// single-purpose helpers
import useShop from "./usePageBuilderLayout/useShop";
import useDnDSetup from "./usePageBuilderLayout/useDnDSetup";
import useInsertSetup from "./usePageBuilderLayout/useInsertSetup";
import useSavePublish from "./usePageBuilderLayout/useSavePublish";
import { computeRevisionId } from "./state/revision";

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
    history: historyProp,
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

  const toolbarProps = createToolbarProps({ controls, selectedIds, state, dispatch, shop, progress, isValid, locales, pagesNav });

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
    locale: controls.locale,
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
    pageId: pageMeta.id,
    showComments,
    zoom: controls.zoom,
    showBaseline: controls.showBaseline,
    baselineStep: controls.baselineStep,
  });

  const previewProps = buildPreviewProps({
    components,
    locale: controls.locale,
    deviceId: controls.previewDeviceId,
    onChange: controls.setPreviewDeviceId,
    editor: (state as { editor?: HistoryState["editor"] }).editor,
    extraDevices: controls.extraDevices,
  });

  const historyProps = buildHistoryProps({
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
    editor: (state as Record<string, unknown> & { editor?: Record<string, unknown> }).editor,
    onRestoreVersion: (restored: PageComponent[]) => {
      dispatch({ type: "set", components: restored });
      handleSave();
    },
    lastPublishedComponents: (pageMeta as { lastPublishedComponents?: PageComponent[] }).lastPublishedComponents,
    onRevertToPublished: handleRevert,
  });

  const tourProps = buildTourProps({
    steps: controls.tourSteps,
    run: controls.runTour,
    callback: controls.handleTourCallback,
  });

  const { parentFirst, setParentFirst } = useLayerSelectionPreference();
  const toggleComments = () => setShowComments((value) => !value);

  useSectionModeInitialSelection({ mode, components, setSelectedIds });

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
  const resolvedPrimaryLocale: Locale =
    (primaryLocale as Locale | undefined) ??
    ((Object.keys(seoTitle).find((key) => {
      const val = seoTitle[key as keyof typeof seoTitle];
      return typeof val === "string" && val.trim().length > 0;
    }) as Locale | undefined) ??
      (locales[0] as Locale));
  const resolvedLocale: Locale =
    (locale as Locale | undefined) ?? resolvedPrimaryLocale;

  const templateCatalog = templates ?? [];

  const buildTemplatePage = useCallback(
    (template: TemplateDescriptor): Page => {
      const next = scaffoldPageFromTemplate(template, {
        shopId: shop ?? "",
        locale: resolvedLocale,
        primaryLocale: resolvedPrimaryLocale,
      });
      return {
        ...next,
        id: pageMeta.id,
        slug: pageMeta.slug ?? "",
        status: pageMeta.status ?? next.status,
        visibility:
          (pageMeta as { visibility?: Page["visibility"] }).visibility ??
          next.visibility,
        createdAt: pageMeta.createdAt ?? next.createdAt,
        updatedAt: pageMeta.updatedAt ?? next.updatedAt,
        createdBy: pageMeta.createdBy ?? next.createdBy,
        seo: {
          ...next.seo,
          title:
            pageMeta.seo?.title && Object.keys(pageMeta.seo.title).length > 0
              ? pageMeta.seo.title
              : next.seo.title,
          description:
            pageMeta.seo?.description &&
            Object.values(pageMeta.seo.description).some((v) => Boolean(v))
              ? pageMeta.seo.description
              : next.seo.description ?? {},
          image:
            pageMeta.seo?.image &&
            Object.keys(pageMeta.seo.image).length > 0
              ? pageMeta.seo.image
              : next.seo.image ?? {},
          noindex: pageMeta.seo?.noindex ?? next.seo.noindex,
        },
      };
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
  const currentRevisionId = useMemo(() => {
    try {
      return computeRevisionId(components);
    } catch {
      return "rev-unknown";
    }
  }, [components]);

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
    [dispatch, setToast, t],
  );

  const templateActions =
    templateCatalog.length > 0
      ? createElement(TemplateActions, {
          templates: templateCatalog,
          currentPage,
          buildTemplatePage,
          onApply: applyTemplate,
        })
      : undefined;

  return {
    style,
    paletteOnAdd: handleAddFromPalette,
    onInsertImageAsset: handleInsertImageAsset,
    onSetSectionBackground: handleSetSectionBackground,
    selectedIsSection,
    onInsertPreset: handleInsertPreset,
    onInsertLinkedSection: handleInsertLinkedSection,
    presetsSourceUrl: presetsSourceUrl ?? process.env.NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL,
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
      breakpoints: Array.isArray((state as Record<string, unknown>)["breakpoints"]) ? ((state as Record<string, unknown>)["breakpoints"] as { id: string; label: string; min?: number; max?: number }[]) : [],
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
    setEditingSizePx: controls.setEditingSizePx,
    crossBreakpointNotices: controls.crossBreakpointNotices,
    onCrossBreakpointNoticesChange: controls.setCrossBreakpointNotices,
    mode,
    canSavePreset,
    onSavePreset,
    templateActions,
    allowedBlockTypes: allowedTypes,
  } as PageBuilderLayoutProps;
};

export default usePageBuilderLayout;
