"use client";

import React from "react";
import useReducedMotion from "../../../hooks/useReducedMotion";
import useDndA11y from "./hooks/useDndA11y";
import usePaletteState from "./hooks/usePaletteState";
import useDevToolsToggle from "./hooks/useDevToolsToggle";
import useCommandPalette from "./hooks/useCommandPalette";
import useSpacePanning from "./hooks/useSpacePanning";
import type { PageBuilderLayoutProps } from "./PageBuilderLayout.types";

const SECTIONS_ONLY = process.env.NEXT_PUBLIC_PB_SECTIONS_ONLY === "true";

type LayoutStateInput = Pick<
  PageBuilderLayoutProps,
  "toolbarProps" | "scrollRef" | "toggleComments" | "showComments" | "mode"
>;

export interface PageBuilderLayoutState {
  reducedMotion: boolean;
  showDevTools: boolean;
  showPalette: boolean;
  showSections: boolean;
  showFontsLeft: boolean;
  showLayersLeft: boolean;
  showInspector: boolean;
  paletteWidth: number;
  setPaletteWidth: (width: number) => void;
  layersWidth: number;
  setLayersWidth: (width: number) => void;
  openPalette: () => void;
  openSections: () => void;
  openFonts: () => void;
  openTheme: () => void;
  openLayers: () => void;
  togglePaletteWithReset: () => void;
  toggleInspector: () => void;
  setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
  globalsOpen: boolean;
  setGlobalsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fontsOpen: boolean;
  setFontsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cmsOpen: boolean;
  setCmsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pagesOpen: boolean;
  setPagesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cmdOpen: boolean;
  setCmdOpen: React.Dispatch<React.SetStateAction<boolean>>;
  helpOpen: boolean;
  setHelpOpen: React.Dispatch<React.SetStateAction<boolean>>;
  a11y: ReturnType<typeof useDndA11y>;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  toolbarLocale: string;
}

export function usePageBuilderLayoutState({
  toolbarProps,
  scrollRef,
  toggleComments,
  showComments,
  mode = "page",
}: LayoutStateInput): PageBuilderLayoutState {
  const reducedMotion = useReducedMotion();
  const { showDevTools } = useDevToolsToggle();
  const { showPalette, setShowPalette, paletteWidth, setPaletteWidth } = usePaletteState();
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const toolbarLocale = (toolbarProps as any)?.locale ?? "en";
  const a11y = useDndA11y(toolbarLocale);
  const { onPointerDown } = useSpacePanning(scrollRef);
  const [showInspector, setShowInspector] = React.useState(true);
  const [showLayersLeft, setShowLayersLeft] = React.useState(false);
  const [layersWidth, setLayersWidth] = React.useState(280);
  const [showSections, setShowSections] = React.useState(false);
  const [showFontsLeft, setShowFontsLeft] = React.useState(false);
  const [showThemeLeft, setShowThemeLeft] = React.useState(false);
  const [globalsOpen, setGlobalsOpen] = React.useState(false);
  const [cmsOpen, setCmsOpen] = React.useState(false);
  const [fontsOpen, setFontsOpen] = React.useState(false);
  const [pagesOpen, setPagesOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  React.useEffect(() => {
    const onToggleComments = () => {
      if (!showComments) {
        try {
          toggleComments();
          setTimeout(() => {
            try {
              window.dispatchEvent(new Event("pb:toggle-comments"));
            } catch {}
          }, 0);
        } catch {}
      }
    };
    window.addEventListener("pb:toggle-comments", onToggleComments as EventListener);
    return () => window.removeEventListener("pb:toggle-comments", onToggleComments as EventListener);
  }, [showComments, toggleComments]);

  const cycleRef = React.useRef(0);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "i") {
        e.preventDefault();
        setShowInspector((v) => !v);
        cycleRef.current = 0;
        return;
      }
      if (k === "l") {
        e.preventDefault();
        setShowLayersLeft((v) => {
          const next = !v;
          if (next) {
            setShowPalette(false);
            setShowSections(false);
          }
          return next;
        });
        cycleRef.current = 0;
        return;
      }
      if (k === "." || k === "›") {
        // Cycle palette → inspector → layers (scroll) → palette
        e.preventDefault();
        cycleRef.current = (cycleRef.current + 1) % 4;
        const step = cycleRef.current;
        switch (step) {
          case 1: // hide palette
            setShowPalette(false);
            setShowLayersLeft(false);
            setShowSections(false);
            break;
          case 2: // hide inspector
            setShowInspector(false);
            break;
          case 3: // show inspector and scroll to layers panel
            setShowInspector(true);
            setTimeout(() => {
              try {
                document.getElementById("pb-layers-panel")?.scrollIntoView();
              } catch {}
            }, 0);
            break;
          case 0: // show palette
          default:
            setShowPalette(true);
            break;
        }
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setShowPalette, setShowSections, setShowLayersLeft, setShowInspector, showPalette, showInspector]);

  React.useEffect(() => {
    if (!SECTIONS_ONLY) return;
    setShowSections(true);
    setShowPalette(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (mode !== "section") return;
    setShowSections(false);
    setShowPalette(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPalette = React.useCallback(() => {
    setShowLayersLeft(false);
    setShowSections(false);
    setShowFontsLeft(false);
    setShowThemeLeft(false);
    setShowPalette(true);
  }, [setShowLayersLeft, setShowPalette, setShowSections]);

  const openSections = React.useCallback(() => {
    setShowLayersLeft(false);
    setShowPalette(false);
    setShowFontsLeft(false);
    setShowThemeLeft(false);
    setShowSections(true);
  }, [setShowLayersLeft, setShowPalette, setShowSections]);

  const openLayers = React.useCallback(() => {
    setShowLayersLeft(true);
    setShowPalette(false);
    setShowSections(false);
    setShowFontsLeft(false);
    setShowThemeLeft(false);
  }, [setShowLayersLeft, setShowPalette, setShowSections]);

  const openFonts = React.useCallback(() => {
    setShowLayersLeft(false);
    setShowPalette(false);
    setShowSections(false);
    setShowFontsLeft(true);
    setShowThemeLeft(false);
  }, []);

  const openTheme = React.useCallback(() => {
    setShowLayersLeft(false);
    setShowPalette(false);
    setShowSections(false);
    setShowFontsLeft(false);
    setShowThemeLeft(true);
  }, []);

  const togglePaletteWithReset = React.useCallback(() => {
    setShowPalette((value) => {
      const next = !value;
      if (next) {
        setShowLayersLeft(false);
        setShowSections(false);
        setShowFontsLeft(false);
      }
      return next;
    });
  }, [setShowLayersLeft, setShowPalette, setShowSections]);

  const toggleInspector = React.useCallback(() => {
    setShowInspector((value) => !value);
  }, []);

  return {
    reducedMotion,
    showDevTools,
    showPalette,
    showSections,
    showFontsLeft,
    showThemeLeft,
    showLayersLeft,
    showInspector,
    paletteWidth,
    setPaletteWidth,
    layersWidth,
    setLayersWidth,
    openPalette,
    openSections,
    openFonts,
    openTheme,
    openLayers,
    togglePaletteWithReset,
    toggleInspector,
    setShowPalette,
    globalsOpen,
    setGlobalsOpen,
    fontsOpen,
    setFontsOpen,
    cmsOpen,
    setCmsOpen,
    pagesOpen,
    setPagesOpen,
    cmdOpen,
    setCmdOpen,
    helpOpen,
    setHelpOpen,
    a11y,
    onPointerDown,
    toolbarLocale,
  };
}
