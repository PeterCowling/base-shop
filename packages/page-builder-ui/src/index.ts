// Public surface for Page Builder React UI.
// Consumers should import all Page Builder React primitives from this package
// instead of reaching into @acme/ui internals.

import type { ComponentProps } from "react";

import DragHandleInternal from "@acme/cms-ui/page-builder/DragHandle";
import {
  clearLibrary as uiClearLibrary,
  type GlobalItem as UiGlobalItem,
  type LibraryItem as UiLibraryItem,
  listGlobals as uiListGlobals,
  listGlobalsForPage as uiListGlobalsForPage,
  // Local library and globals store used by the builder.
  listLibrary as uiListLibrary,
  removeGlobal as uiRemoveGlobal,
  removeGlobalForPage as uiRemoveGlobalForPage,
  removeLibrary as uiRemoveLibrary,
  saveGlobal as uiSaveGlobal,
  saveGlobalForPage as uiSaveGlobalForPage,
  saveLibrary as uiSaveLibrary,
  saveLibraryStrict as uiSaveLibraryStrict,
  syncFromServer as uiSyncLibraryFromServer,
  updateGlobal as uiUpdateGlobal,
  updateGlobalForPage as uiUpdateGlobalForPage,
  updateLibrary as uiUpdateLibrary,
} from "@acme/cms-ui/page-builder/libraryStore";
import SizeControlsInternal from "@acme/cms-ui/page-builder/panels/layout/SizeControls";
import PreviewRendererInternal from "@acme/cms-ui/page-builder/PreviewRenderer";
import type { BlockRegistryEntry as UiBlockRegistryEntry } from "@acme/ui";
import {
  applyTextThemeToOverrides,
  // Block/component editors used by CMS
  ComponentEditor as UiComponentEditor,
  // Starter registry from default theme
  coreBlockRegistry as uiCoreBlockRegistry,
  // Text theme helpers used by editor and runtime
  extractTextThemes,
  ImagePicker as UiImagePicker,
  // Editor shell primitives
  PageBuilder as UiPageBuilder,
  PageBuilderLayout as UiPageBuilderLayout,
  PageCanvas as UiPageCanvas,
  PageSidebar as UiPageSidebar,
  PageToolbar as UiPageToolbar,
  useAutoSave as uiUseAutoSave,
  useBlockDimensions as uiUseBlockDimensions,
  useBlockDnD as uiUseBlockDnD,
  useBlockTransform as uiUseBlockTransform,
  useCanvasDrag as uiUseCanvasDrag,
  useCanvasResize as uiUseCanvasResize,
  useComponentInputs as uiUseComponentInputs,
  useLocalizedTextEditor as uiUseLocalizedTextEditor,
  usePageBuilderControls as uiUsePageBuilderControls,
  usePageBuilderDnD as uiUsePageBuilderDnD,
  usePageBuilderSave as uiUsePageBuilderSave,
  // State and interaction hooks
  usePageBuilderState as uiUsePageBuilderState,
} from "@acme/ui";

export { applyTextThemeToOverrides,extractTextThemes };

export type {
  BlockDescriptor,
  BlockRegistry,
  BlockRegistryEntryConfig,
  BlockTypeId,
} from "@acme/page-builder-core";
export { buildBlockRegistry, coreBlockDescriptors } from "@acme/page-builder-core";

// Package semantic version. Kept in sync with package.json.
export const version = "1.0.0";

/**
 * Top‑level Page Builder editor component.
 *
 * This wraps the internal layout, state hooks, and drag‑and‑drop wiring into
 * a single React component suitable for embedding in CMS apps.
 */
export const PageBuilder = UiPageBuilder;

/**
 * Low‑level layout shell for the Page Builder editor.
 *
 * Most callers should use `PageBuilder`; advanced callers can render
 * `PageBuilderLayout` directly when they need custom wiring.
 */
export const PageBuilderLayout = UiPageBuilderLayout;

export const PageToolbar = UiPageToolbar;
export const PageCanvas = UiPageCanvas;
export const PageSidebar = UiPageSidebar;

export type PageBuilderProps = ComponentProps<typeof UiPageBuilder>;
export type PageBuilderLayoutProps = ComponentProps<typeof UiPageBuilderLayout>;

// Editor‑level block/component primitives
export const ComponentEditor = UiComponentEditor;
export const ImagePicker = UiImagePicker;
export const DragHandle = DragHandleInternal;
export const SizeControls = SizeControlsInternal;
export const PreviewRenderer = PreviewRendererInternal;

// Library and globals helpers used by CMS flows
export type LibraryItem = UiLibraryItem;
export type GlobalItem = UiGlobalItem;

export const listLibrary = uiListLibrary;
export const saveLibrary = uiSaveLibrary;
export const saveLibraryStrict = uiSaveLibraryStrict;
export const syncLibraryFromServer = uiSyncLibraryFromServer;
export const clearLibrary = uiClearLibrary;
export const updateLibrary = uiUpdateLibrary;
export const removeLibrary = uiRemoveLibrary;

export const listGlobals = uiListGlobals;
export const saveGlobal = uiSaveGlobal;
export const updateGlobal = uiUpdateGlobal;
export const removeGlobal = uiRemoveGlobal;
export const listGlobalsForPage = uiListGlobalsForPage;
export const saveGlobalForPage = uiSaveGlobalForPage;
export const updateGlobalForPage = uiUpdateGlobalForPage;
export const removeGlobalForPage = uiRemoveGlobalForPage;

// State and interaction hooks (providers in hook form)
export const usePageBuilderState = uiUsePageBuilderState;
export const usePageBuilderDnD = uiUsePageBuilderDnD;
export const usePageBuilderControls = uiUsePageBuilderControls;
export const usePageBuilderSave = uiUsePageBuilderSave;
export const useAutoSave = uiUseAutoSave;
export const useCanvasDrag = uiUseCanvasDrag;
export const useCanvasResize = uiUseCanvasResize;
export const useBlockDimensions = uiUseBlockDimensions;
export const useBlockDnD = uiUseBlockDnD;
export const useBlockTransform = uiUseBlockTransform;
export const useLocalizedTextEditor = uiUseLocalizedTextEditor;
export const useComponentInputs = uiUseComponentInputs;

// Starter registry aligned with the default theme (core descriptors + default UI blocks)
export const starterBlockRegistry = uiCoreBlockRegistry;
export type StarterBlockRegistryEntry = UiBlockRegistryEntry<Record<string, unknown>>;
export type StarterBlockRegistry = typeof starterBlockRegistry;
