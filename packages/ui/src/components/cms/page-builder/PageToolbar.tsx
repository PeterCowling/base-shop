"use client";

import type { Locale } from "@acme/i18n/locales";
import { ReloadIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import React, { useEffect } from "react";
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Dialog, DialogContent, DialogTrigger } from "../../atoms/shadcn";
import { Popover, PopoverContent, PopoverTrigger, Tooltip as UITooltip } from "../../atoms";
import { getLegacyPreset } from "../../../utils/devicePresets";
import DeviceSelector from "../../common/DeviceSelector";
import BreakpointsPanel, { type Breakpoint } from "./panels/BreakpointsPanel";
import { DesignMenuContent } from "./DesignMenu";
import { Tooltip } from "../../atoms";
import { useRouter } from "next/navigation";

interface Props {
  deviceId: string;
  setDeviceId: (id: string) => void;
  orientation: "portrait" | "landscape";
  setOrientation: (o: "portrait" | "landscape") => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  locales: readonly Locale[];
  progress: { done: number; total: number } | null;
  isValid: boolean | null;
  breakpoints?: Breakpoint[];
  setBreakpoints?: (list: Breakpoint[]) => void;
  extraDevices?: import("../../../utils/devicePresets").DevicePreset[];
  // Editing size control (px) for current viewport
  editingSizePx?: number | null;
  setEditingSizePx?: (px: number | null) => void;
  // Zoom indicator/control (compact)
  zoom?: number;
  setZoom?: (z: number) => void;
  // Pages navigator (builder)
  pagesNav?: { items: { label: string; value: string; href: string }[]; current: string };
  // Hide clusters (Section mode simplification)
  hideDeviceManager?: boolean;
  hidePagesNav?: boolean;
}

const PageToolbar = ({
  deviceId,
  setDeviceId,
  orientation,
  setOrientation,
  locale,
  setLocale,
  locales,
  progress,
  isValid,
  breakpoints,
  setBreakpoints,
  extraDevices,
  editingSizePx,
  setEditingSizePx,
  zoom,
  setZoom,
  pagesNav,
  hideDeviceManager,
  hidePagesNav,
}: Props) => {
  // Only access Next.js router when the pages navigator is used to avoid
  // requiring an app router context in tests/standalone usage.
  const router = pagesNav ? useRouter() : (null as unknown as ReturnType<typeof useRouter> | null);
  useEffect(() => {
    const presets: Record<string, string> = {
      1: getLegacyPreset("desktop").id,
      2: getLegacyPreset("tablet").id,
      3: getLegacyPreset("mobile").id,
    };

    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.tagName === "SELECT" ||
          e.target.isContentEditable)
      ) {
        return;
      }
      const id = presets[e.key];
      if (id && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setDeviceId(id);
        setOrientation("portrait");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setDeviceId, setOrientation]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState<number>(0);
  const [sizeOpen, setSizeOpen] = React.useState(false);
  const [sizeDraft, setSizeDraft] = React.useState<string>("");
  const [breakpointsOpen, setBreakpointsOpen] = React.useState(false);
  const [designOpen, setDesignOpen] = React.useState(false);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || el.clientWidth;
      setW(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Allow external triggers (e.g., Studio menu) to open the Breakpoints manager
  React.useEffect(() => {
    const open = () => setBreakpointsOpen(true);
    window.addEventListener("pb:open-breakpoints", open as EventListener);
    return () => window.removeEventListener("pb:open-breakpoints", open as EventListener);
  }, []);

  // Allow external trigger to open the Design options modal
  React.useEffect(() => {
    const open = () => setDesignOpen(true);
    window.addEventListener("pb:open-design", open as EventListener);
    return () => window.removeEventListener("pb:open-design", open as EventListener);
  }, []);

  // Design inline button removed; keep width tracking for other thresholds.

  return (
    <div className="flex w-full flex-wrap items-center gap-2" ref={containerRef}>
      {/* Design options modal (openable from StudioMenu) */}
      <Dialog open={designOpen} onOpenChange={setDesignOpen}>
        <DialogContent className="max-w-sm">
          <DesignMenuContent
            breakpoints={breakpoints ?? []}
            onChangeBreakpoints={(list) => setBreakpoints?.(list)}
          />
        </DialogContent>
      </Dialog>
      {/* Page selector (left of device selector) */}
      {!hidePagesNav && pagesNav && pagesNav.items?.length ? (
        <Select
          value={pagesNav.current}
          onValueChange={(v) => {
            const next = pagesNav.items.find((i) => i.value === v) || null;
            if (next?.href) router?.push(next.href as any);
          }}
        >
          <SelectTrigger className="!h-8 !w-[50px] text-xs" aria-label="Page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pagesNav.items.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {/* Left cluster: device + rotate */}
      {!hideDeviceManager && (
        <div className="flex items-center gap-2 shrink-0">
          <DeviceSelector
            deviceId={deviceId}
            onChange={(id: string) => {
              setDeviceId(id);
              setOrientation("portrait");
            }}
            showLegacyButtons
            compact
            extraDevices={extraDevices}
          />
          {/* Zoom control removed per requirements */}
          {/* Breakpoints overflow: three-dot menu next to device selector */}
          <Dialog open={breakpointsOpen} onOpenChange={setBreakpointsOpen}>
            <DialogTrigger asChild>
              <Tooltip text="Manage breakpoints">
                <Button variant="outline" size="icon" aria-label="Manage breakpoints">
                  •••
                </Button>
              </Tooltip>
            </DialogTrigger>
            <BreakpointsPanel
              breakpoints={breakpoints ?? []}
              onChange={(list) => setBreakpoints?.(list)}
            />
          </Dialog>
          {/* Editing size: popover with numeric input + Done (per viewport) */}
          <Popover open={sizeOpen} onOpenChange={(o) => {
            setSizeOpen(o);
            if (o) setSizeDraft((editingSizePx ?? "").toString());
          }}>
            <UITooltip text="Editing size (px)">
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 px-2 text-xs" aria-label="Editing size">
                  {editingSizePx ? `${editingSizePx}px` : "Size"}
                </Button>
              </PopoverTrigger>
            </UITooltip>
            <PopoverContent align="start" className="w-40 space-y-2">
              <label className="text-xs text-muted-foreground" htmlFor="pb-editing-size">Editing size (px)</label>
              <input
                id="pb-editing-size"
                type="number"
                className="h-8 w-full rounded border px-2 text-xs"
                placeholder="px"
                value={sizeDraft}
                onChange={(e) => setSizeDraft(e.target.value)}
              />
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    if (!setEditingSizePx) { setSizeOpen(false); return; }
                    const v = sizeDraft.trim();
                    if (!v) { setEditingSizePx(null); setSizeOpen(false); return; }
                    const n = parseInt(v, 10);
                    if (Number.isFinite(n)) setEditingSizePx(Math.max(320, Math.min(1920, n)));
                    setSizeOpen(false);
                  }}
                >
                  Done
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => { setSizeOpen(false); }}
                >
                  Cancel
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Tooltip text="Rotate">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setOrientation(orientation === "portrait" ? "landscape" : "portrait")
              }
              aria-label="Rotate"
            >
              <ReloadIcon
                className={(orientation === "landscape" ? "rotate-90 " : "") + "h-4 w-4"}
                aria-hidden="true"
              />
            </Button>
          </Tooltip>
        </div>
      )}
      {/* Middle cluster: design menu removed per spec */}
      {/* Right cluster: locales — hidden when only one locale (EN) */}
      {locales.length > 1 ? (
        <div className="ml-auto flex flex-wrap items-center gap-1 basis-full md:basis-auto">
          {locales.length > 3 ? (
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger className="h-8 w-28 text-xs" aria-label="Locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            locales.map((l) => (
              <Button
                key={l}
                variant={locale === l ? "default" : "outline"}
                className="h-8 px-2 text-xs"
                onClick={() => setLocale(l)}
              >
                {l.toUpperCase()}
              </Button>
            ))
          )}
        </div>
      ) : null}
      {progress && (
        <p className="basis-full text-xs">
          Uploading image… {progress.done}/{progress.total}
        </p>
      )}
      {isValid === false && (
        <p className="basis-full text-xs text-warning">
          Wrong orientation (needs landscape)
        </p>
      )}
    </div>
  );
};

export default PageToolbar;
