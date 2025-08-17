import type { Locale } from "@acme/i18n/locales";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../../atoms/shadcn";
import { getLegacyPreset } from "@ui/utils/devicePresets";
import DeviceSelector from "@ui/components/common/DeviceSelector";

interface Props {
  viewport: "desktop" | "tablet" | "mobile";
  deviceId: string;
  setDeviceId: (id: string) => void;
  orientation: "portrait" | "landscape";
  setOrientation: (o: "portrait" | "landscape") => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  locales: readonly Locale[];
  progress: { done: number; total: number } | null;
  isValid: boolean | null;
  showGrid: boolean;
  toggleGrid: () => void;
  gridCols: number;
  setGridCols: (n: number) => void;
}

const PageToolbar = ({
  viewport,
  deviceId,
  setDeviceId,
  orientation,
  setOrientation,
  locale,
  setLocale,
  locales,
  progress,
  isValid,
  showGrid,
  toggleGrid,
  gridCols,
  setGridCols,
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
            </ul>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={showGrid ? "default" : "outline"}
          onClick={toggleGrid}
        >
          {showGrid ? "Hide grid" : "Show grid"}
        </Button>
        <Input
          type="number"
          min={1}
          max={24}
          value={gridCols}
          onChange={(e) => setGridCols(Number(e.target.value))}
          className="w-16"
        />
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
