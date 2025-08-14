import type { Locale } from "@/i18n/locales";
import { Button, Input } from "../../atoms/shadcn";
import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";

interface Props {
  viewport: "desktop" | "tablet" | "mobile";
  setViewport: (v: "desktop" | "tablet" | "mobile") => void;
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

const icons = {
  desktop: DesktopIcon,
  tablet: LaptopIcon,
  mobile: MobileIcon,
} as const;

const PageToolbar = ({
  viewport,
  setViewport,
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
      {(["desktop", "tablet", "mobile"] as const).map((v) => {
        const Icon = icons[v];
        return (
          <Button
            key={v}
            variant={viewport === v ? "default" : "outline"}
            onClick={() => setViewport(v)}
            aria-label={v}
            className="p-2"
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
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
