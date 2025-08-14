import type { Locale } from "@/i18n/locales";
import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import { Button, Input } from "../../atoms/shadcn";
import { getLegacyPreset } from "@ui/utils/devicePresets";
import DeviceSelector from "../DeviceSelector";

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
        {(["desktop", "tablet", "mobile"] as const).map((t, i) => {
          const preset = getLegacyPreset(t);
          const Icon =
            t === "desktop" ? DesktopIcon : t === "tablet" ? LaptopIcon : MobileIcon;
          const shortcut = `Ctrl+${i + 1}`;
          return (
            <Button
              key={t}
              variant={deviceId === preset.id ? "default" : "outline"}
              onClick={() => {
                setDeviceId(preset.id);
                setOrientation("portrait");
              }}
              title={`${t.charAt(0).toUpperCase() + t.slice(1)} (${shortcut})`}
              aria-label={`${t} (${shortcut})`}
            >
              <Icon />
              <span className="sr-only">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </Button>
          );
        })}
        <DeviceSelector
          deviceId={deviceId}
          orientation={orientation}
          setDeviceId={(id) => {
            setDeviceId(id);
            setOrientation("portrait");
          }}
          toggleOrientation={() =>
            setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"))
          }
        />
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
