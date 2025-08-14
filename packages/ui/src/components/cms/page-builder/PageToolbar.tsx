import type { Locale } from "@/i18n/locales";
import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../atoms/shadcn";
import { devicePresets, getLegacyPreset } from "@ui/utils/devicePresets";

interface Props {
  viewport: "desktop" | "tablet" | "mobile";
  deviceId: string;
  setDeviceId: (id: string) => void;
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
  locale,
  setLocale,
  locales,
  progress,
  isValid,
  showGrid,
  toggleGrid,
  gridCols,
  setGridCols,
}: Props) => (
  <div className="flex flex-col gap-4">
    <div className="flex justify-end gap-2">
      {(["desktop", "tablet", "mobile"] as const).map((t) => {
        const preset = getLegacyPreset(t);
        const Icon =
          t === "desktop" ? DesktopIcon : t === "tablet" ? LaptopIcon : MobileIcon;
        return (
          <Button
            key={t}
            variant={deviceId === preset.id ? "default" : "outline"}
            onClick={() => setDeviceId(preset.id)}
            aria-label={t}
          >
            <Icon />
            <span className="sr-only">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
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

export default PageToolbar;
