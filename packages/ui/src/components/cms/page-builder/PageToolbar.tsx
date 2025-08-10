import type { Locale } from "@/i18n/locales";
import { Button } from "../../atoms/shadcn";

interface Props {
  viewport: "desktop" | "tablet" | "mobile";
  setViewport: (v: "desktop" | "tablet" | "mobile") => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  locales: readonly Locale[];
  progress: { done: number; total: number } | null;
  isValid: boolean | null;
}

const PageToolbar = ({
  viewport,
  setViewport,
  locale,
  setLocale,
  locales,
  progress,
  isValid,
}: Props) => (
  <div className="flex flex-col gap-4">
    <div className="flex justify-end gap-2">
      {(["desktop", "tablet", "mobile"] as const).map((v) => (
        <Button
          key={v}
          variant={viewport === v ? "default" : "outline"}
          onClick={() => setViewport(v)}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </Button>
      ))}
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
