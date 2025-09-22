"use client";

import type { Locale } from "@acme/i18n/locales";
import { ReloadIcon } from "@radix-ui/react-icons";
import React, { useEffect } from "react";
import { Button, Dialog, DialogTrigger, DialogContent, DialogTitle, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../atoms/shadcn";
import { getLegacyPreset } from "../../../utils/devicePresets";
import DeviceSelector from "../../common/DeviceSelector";
import type { Breakpoint } from "./panels/BreakpointsPanel";
import DesignMenu, { DesignMenuContent } from "./DesignMenu";
import MoreMenu from "./MoreMenu";
import { Tooltip } from "../../atoms";

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
}: Props) => {
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

  const [helpOpen, setHelpOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState<number>(0);
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

  const showDesignInline = w >= 420;
  const showHelpIcon = w >= 440;
  const moreItems: { label: string; onClick: () => void }[] = [];
  const moreContent: React.ReactNode = !showDesignInline ? (
    <DesignMenuContent
      breakpoints={breakpoints ?? []}
      onChangeBreakpoints={(list) => setBreakpoints?.(list)}
    />
  ) : undefined;
  if (!showHelpIcon) moreItems.push({ label: "Keyboard shortcuts", onClick: () => setHelpOpen(true) });

  return (
    <div className="flex w-full flex-wrap items-center gap-2" ref={containerRef}>
      {/* Left cluster: device + rotate */}
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
      {/* Middle cluster: design menu + help */}
      <div className="flex items-center gap-2 shrink-0">
        {showDesignInline && (
          <DesignMenu
            breakpoints={breakpoints ?? []}
            onChangeBreakpoints={(list) => setBreakpoints?.(list)}
          />
        )}
        {showHelpIcon ? (
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Tooltip text="Keyboard shortcuts">
                <Button variant="outline" size="icon" aria-label="Keyboard shortcuts">
                  ?
                </Button>
              </Tooltip>
            </DialogTrigger>
            <DialogContent className="space-y-2">
              <DialogTitle>Keyboard shortcuts</DialogTitle>
              <ul className="space-y-1 text-sm">
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd> Save
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>P</kbd> Toggle preview
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>B</kbd> Toggle palette
                </li>
                <li>
                  <kbd>Shift</kbd> + <kbd>Arrow</kbd> Resize selected block
                </li>
                <li>
                  Hold <kbd>Shift</kbd> while dragging to lock to an axis
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Arrow</kbd> Adjust spacing
                </li>
                <li className="text-xs text-muted-foreground">
                  When snap to grid is enabled, steps use the grid unit
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>[</kbd> Rotate
                  device left
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>]</kbd> Rotate
                  device right
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Z</kbd> Undo
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Y</kbd> Redo
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>1</kbd> Desktop view
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>2</kbd> Tablet view
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>3</kbd> Mobile view
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> Save Version
                </li>
                <li>
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> Open Versions
                </li>
              </ul>
            </DialogContent>
          </Dialog>
        ) : null}
        {(!showHelpIcon || !showDesignInline) && (
          <MoreMenu items={moreItems} content={moreContent} />
        )}
      </div>
      {/* Right cluster: locales (wraps to new line when tight) */}
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
