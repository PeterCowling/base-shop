// apps/cms/src/app/cms/wizard/WizardPreview.tsx

"use client";

import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@ui/components/atoms";
import { blockRegistry } from "@ui/components/cms/blocks";
import { Footer, Header, SideNav } from "@ui/components/organisms";
import { AppShell } from "@ui/components/templates";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import type { PageComponent } from "@acme/types";
import DOMPurify from "dompurify";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { STORAGE_KEY } from "../configurator/hooks/useConfiguratorPersistence";
import { loadPreviewTokens, PREVIEW_TOKENS_EVENT } from "./previewTokens";
import { devicePresets, type DevicePreset } from "@ui/utils/devicePresets";
import DeviceSelector from "@ui/components/common/DeviceSelector";
import { ReloadIcon } from "@radix-ui/react-icons";
import { usePreviewDevice } from "@ui/hooks";

interface Props {
  style: React.CSSProperties;
  /** Enable inspection mode to highlight tokenised elements */
  inspectMode?: boolean;
  /** Called when a tokenised element is clicked */
  onTokenSelect?: (token: string, coords: { x: number; y: number }) => void;
  device?: DevicePreset;
}

/**
 * Renders a live preview of the page the wizard is currently building.
 * The preview reads wizard state from localStorage (keyed by `STORAGE_KEY`)
 * so it always shows the latest edits without needing a full refresh.
 */
export default function WizardPreview({
  style,
  inspectMode = false,
  onTokenSelect,
  device: deviceProp,
}: Props): React.JSX.Element {
  const [deviceId, setDeviceId] = usePreviewDevice(devicePresets[0].id);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const device = useMemo<DevicePreset>(() => {
    if (deviceProp) return deviceProp;
    const preset =
      devicePresets.find((d) => d.id === deviceId) ?? devicePresets[0];
    return orientation === "portrait"
      ? { ...preset, orientation }
      : {
          ...preset,
          width: preset.height,
          height: preset.width,
          orientation,
        };
  }, [deviceId, orientation, deviceProp]);
  const viewport: "desktop" | "tablet" | "mobile" = device.type;
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [themeStyle, setThemeStyle] = useState<React.CSSProperties>(() => ({
    ...style,
    ...loadPreviewTokens(),
  }));
  const [hoverEl, setHoverEl] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<{
    el: HTMLElement;
    token: string;
  } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const tokenElsRef = useRef<HTMLElement[]>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);

  /* ------------------------------------------------------------------ */
  /*             Sync wizard state from localStorage                    */
  /*  Re-sync when localStorage changes or when a custom event fires.   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const load = () => {
      try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return;
        const data = JSON.parse(json);
        if (Array.isArray(data.components)) {
          setComponents(data.components as PageComponent[]);
        }
      } catch {
        /* ignore JSON errors */
      }
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("configurator:update", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("configurator:update", load);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /*                  Theme token subscription                           */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const handle = () => {
      setThemeStyle((prev) => ({ ...prev, ...loadPreviewTokens() }));
    };
    handle();
    window.addEventListener("storage", handle);
    window.addEventListener(PREVIEW_TOKENS_EVENT, handle);
    return () => {
      window.removeEventListener("storage", handle);
      window.removeEventListener(PREVIEW_TOKENS_EVENT, handle);
    };
  }, []);

  useEffect(() => {
    setThemeStyle((prev) => ({ ...prev, ...style }));
  }, [style]);

  /* ------------------------------------------------------------------ */
  /*                         Helpers                                    */
  /* ------------------------------------------------------------------ */

  const containerStyle = {
    ...themeStyle,
    width: `${device.width}px`,
    height: `${device.height}px`,
  };

  /* ------------------------------------------------------------------ */
  /*                         Inspect mode                               */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!hoverEl || selected?.el === hoverEl) return;
    const prev = hoverEl.style.outline;
    hoverEl.style.outline = "2px solid #3b82f6";
    return () => {
      hoverEl.style.outline = prev;
    };
  }, [hoverEl, selected]);

  useEffect(() => {
    if (!selected || !popoverOpen) return;
    const el = selected.el;
    const prevOutline = el.style.outline;
    const prevAnimation = el.style.animation;
    el.style.outline = "2px solid #3b82f6";
    el.style.animation = "wizard-outline 1s ease-in-out infinite";
    return () => {
      el.style.outline = prevOutline;
      el.style.animation = prevAnimation;
    };
  }, [selected, popoverOpen]);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent =
      "@keyframes wizard-outline{0%,100%{outline-color:#3b82f6;}50%{outline-color:#93c5fd;}}";
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    if (!inspectMode || !previewRef.current) return;
    tokenElsRef.current = Array.from(
      previewRef.current.querySelectorAll("[data-token]")
    ) as HTMLElement[];
  }, [components, inspectMode]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!inspectMode || popoverOpen) return;
    const el = (e.target as HTMLElement).closest(
      "[data-token]"
    ) as HTMLElement | null;
    setHoverEl(el);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inspectMode) return;
    const el = (e.target as HTMLElement).closest(
      "[data-token]"
    ) as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    const token = el.getAttribute("data-token");
    if (!token) return;
    const rect = el.getBoundingClientRect();
    setSelected({ el, token });
    setPopoverPos({ x: rect.left + rect.width / 2, y: rect.bottom });
    setPopoverOpen(true);
    const idx = tokenElsRef.current.indexOf(el);
    if (idx >= 0) setSelectedIndex(idx);
  };

  const handleLeave = () => {
    if (!inspectMode || popoverOpen) return;
    setHoverEl(null);
  };

  const selectByIndex = (idx: number) => {
    const els = tokenElsRef.current;
    if (!els.length) return;
    const el = els[idx];
    const token = el.getAttribute("data-token");
    if (!token) return;
    const rect = el.getBoundingClientRect();
    setSelected({ el, token });
    setPopoverPos({ x: rect.left + rect.width / 2, y: rect.bottom });
    setPopoverOpen(true);
    setSelectedIndex(idx);
  };

  useEffect(() => {
    if (!inspectMode) return;
    const keyHandler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        const next =
          selectedIndex + 1 < tokenElsRef.current.length
            ? selectedIndex + 1
            : 0;
        selectByIndex(next);
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          selectedIndex - 1 >= 0
            ? selectedIndex - 1
            : tokenElsRef.current.length - 1;
        selectByIndex(prev);
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [inspectMode, selectedIndex]);

  /** Renders a single block component */
  function Block({ component }: { component: PageComponent }) {
    /* Plain rich-text blocks are handled separately */
    if (component.type === "Text") {
      const text = (component as Record<string, unknown>).text;
      const value =
        typeof text === "string"
          ? text
          : ((text as Record<string, string>).en ?? "");
      const sanitized = DOMPurify.sanitize(value);
      return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
    }

    /* Look up the React component in the block registry.
       We cast through `unknown` first to silence TS2352, because
       individual block components have stricter prop requirements
       than the generic Record<string, unknown> we use here. */
    const entry = (
      blockRegistry as unknown as Record<
        string,
        { component: React.ComponentType<Record<string, unknown>> }
      >
    )[component.type];

    const Comp = entry?.component;

    if (!Comp) return null;

    /* Remove metadata fields before spreading props */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      id: _id,
      type: _type,
      ...props
    } = component as Record<string, unknown>;

    return <Comp {...props} locale="en" />;
  }

  /* ------------------------------------------------------------------ */
  /*                             Render                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-2">
      {/* viewport switcher */}
      {!deviceProp && (
        <div className="flex justify-end gap-2">
          <DeviceSelector
            deviceId={deviceId}
            onChange={(id) => {
              setDeviceId(id);
              setOrientation("portrait");
            }}
            showLegacyButtons
          />
          <Button
            variant="outline"
            onClick={() =>
              setOrientation((o) =>
                o === "portrait" ? "landscape" : "portrait"
              )
            }
            aria-label="Rotate"
          >
            <ReloadIcon
              className={orientation === "landscape" ? "rotate-90" : ""}
            />
          </Button>
        </div>
      )}

      {/* live preview */}
      <div
        ref={previewRef}
        style={containerStyle}
        className={`mx-auto rounded border ${inspectMode ? "cursor-crosshair" : ""}`}
        data-token="--color-bg"
        onPointerMove={handlePointerMove}
        onClickCapture={handleClick}
        onPointerLeave={handleLeave}
      >
        <TranslationsProvider messages={enMessages}>
          <AppShell
            header={<Header locale="en" />}
            sideNav={<SideNav />}
            footer={<Footer />}
          >
            {components.map((c) => (
              <Block key={c.id} component={c} />
            ))}
          </AppShell>
        </TranslationsProvider>
      </div>
      {selected && popoverPos && (
        <Popover
          open={popoverOpen}
          onOpenChange={(o) => {
            setPopoverOpen(o);
            if (!o) {
              setSelected(null);
              setSelectedIndex(-1);
            }
          }}
        >
          <PopoverAnchor asChild>
            <div
              style={{
                position: "fixed",
                left: popoverPos.x,
                top: popoverPos.y,
              }}
            />
          </PopoverAnchor>
          <PopoverContent side="top" align="center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{selected.token}</span>
              <Button
                className="px-2 py-1 text-xs"
                onClick={() => onTokenSelect?.(selected.token, popoverPos)}
              >
                Jump to editor
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
