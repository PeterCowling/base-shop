"use client";

import type { Locale } from "@acme/i18n/locales";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import { Button, Dialog, DialogTrigger, DialogContent, DialogTitle } from "../../atoms/shadcn";
import { getLegacyPreset } from "../../../utils/devicePresets";
import DeviceSelector from "../../common/DeviceSelector";
import ThemePanel from "./ThemePanel";
import BreakpointsPanel, { type Breakpoint } from "./panels/BreakpointsPanel";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <DeviceSelector
          deviceId={deviceId}
          onChange={(id: string) => {
            setDeviceId(id);
            setOrientation("portrait");
          }}
          showLegacyButtons
          extraDevices={extraDevices}
        />
        <Button
          variant="outline"
          onClick={() =>
            setOrientation(orientation === "portrait" ? "landscape" : "portrait")
          }
          aria-label="Rotate"
        >
          <ReloadIcon
            className={orientation === "landscape" ? "rotate-90" : ""}
          />
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" aria-label="Theme">
              Theme
            </Button>
          </DialogTrigger>
          <ThemePanel />
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" aria-label="Breakpoints">
              Breakpoints
            </Button>
          </DialogTrigger>
          <BreakpointsPanel
            breakpoints={breakpoints ?? []}
            onChange={(list) => setBreakpoints?.(list)}
          />
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" aria-label="Keyboard shortcuts">
              ?
            </Button>
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
                <kbd>Shift</kbd> + <kbd>Arrow</kbd> Resize selected block
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
      </div>
      <div className="flex justify-end gap-2">
        {locales.map((l) => (
          <Button
            key={l}
            variant={locale === l ? "default" : "outline"}
            onClick={() => setLocale(l)}
          >
            {l.toUpperCase()}
          </Button>
        ))}
      </div>
      {progress && (
        <p className="text-sm">
          Uploading image… {progress.done}/{progress.total}
        </p>
      )}
      {isValid === false && (
        <p className="text-sm text-warning">
          Wrong orientation (needs landscape)
        </p>
      )}
    </div>
  );
};

export default PageToolbar;
