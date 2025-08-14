// apps/cms/src/app/cms/wizard/WizardPreview.tsx

"use client";

import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/atoms";
import { blockRegistry } from "@/components/cms/blocks";
import { Footer, Header, SideNav } from "@/components/organisms";
import { AppShell } from "@/components/templates/AppShell";
import TranslationsProvider from "@/i18n/Translations";
import enMessages from "@i18n/en.json";
import type { PageComponent } from "@acme/types";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { STORAGE_KEY } from "../configurator/hooks/useConfiguratorPersistence";
import {
  loadPreviewTokens,
  PREVIEW_TOKENS_EVENT,
} from "./previewTokens";
import { devicePresets, getLegacyPreset, type DevicePreset } from "@ui/utils/devicePresets";

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
  const [deviceId, setDeviceId] = useState(devicePresets[0].id);
  const device = useMemo<DevicePreset>(() => {
    if (deviceProp) return deviceProp;
    return devicePresets.find((d) => d.id === deviceId) ?? devicePresets[0];
  }, [deviceId, deviceProp]);
  const viewport: "desktop" | "tablet" | "mobile" = device.type;
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [themeStyle, setThemeStyle] = useState<React.CSSProperties>(() => ({
    ...style,
    ...loadPreviewTokens(),
  }));
  const [highlight, setHighlight] = useState<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);

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
    window.addEventListener("theme:change", handle);
    return () => {
      window.removeEventListener("storage", handle);
      window.removeEventListener(PREVIEW_TOKENS_EVENT, handle);
      window.removeEventListener("theme:change", handle);
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
    if (!highlight) return;
    const prev = highlight.style.outline;
    highlight.style.outline = "2px solid #3b82f6";
    return () => {
      highlight.style.outline = prev;
    };
  }, [highlight]);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!inspectMode || clickTimeoutRef.current) return;
    const el = (e.target as HTMLElement).closest("[data-token]") as
      | HTMLElement
      | null;
    setHighlight(el);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inspectMode) return;
    const el = (e.target as HTMLElement).closest("[data-token]");
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    setHighlight(el as HTMLElement);
    const token = el.getAttribute("data-token");
    if (token) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const coords = { x: rect.left + rect.width / 2, y: rect.bottom };
      onTokenSelect?.(token, coords);
    }
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
      setHighlight(null);
    }, 1000);
  };

  const handleLeave = () => {
    if (!inspectMode || clickTimeoutRef.current) return;
    setHighlight(null);
  };

  /** Renders a single block component */
  function Block({ component }: { component: PageComponent }) {
    /* Plain rich-text blocks are handled separately */
    if (component.type === "Text") {
      const text = (component as Record<string, unknown>).text;
      const value =
        typeof text === "string"
          ? text
          : ((text as Record<string, string>).en ?? "");
      return <div dangerouslySetInnerHTML={{ __html: value }} />;
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
          {(["desktop", "tablet", "mobile"] as const).map((t) => {
            const preset = getLegacyPreset(t);
            return (
              <Button
                key={t}
                variant={deviceId === preset.id ? "default" : "outline"}
                onClick={() => setDeviceId(preset.id)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            );
          })}
          <Select value={deviceId} onValueChange={setDeviceId}>
            <SelectTrigger aria-label="Device" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {devicePresets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </div>
  );
}
