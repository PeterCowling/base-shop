"use client";

import { Button } from "@ui/components/atoms/shadcn";
import StyleEditor from "@ui/components/cms/StyleEditor";
import { getContrast } from "@ui/components/cms";
import type { TokenMap } from "@ui/hooks/useTokenEditor";
import ThemeSpectrum from "@ui/components/cms/ThemeSpectrum";
import ColorThemeSelector from "./ColorThemeSelector";

const MIN_CONTRAST = 4.5;

function checkContrast(fg?: string, bg?: string): number {
  if (!fg || !bg) return MIN_CONTRAST;
  return getContrast(fg, bg);
}

interface ThemeEditorFormProps {
  themes: string[];
  theme: string;
  onThemeChange: (v: string) => void;
  colorPalettes: Array<{ name: string; colors: Record<string, string> }>;
  palette: string;
  setPalette: (name: string) => void;
  themeOverrides: Record<string, string>;
  themeDefaults: Record<string, string>;
  onTokensChange: (tokens: TokenMap) => void;
  onReset: () => void;
}

export default function ThemeEditorForm({
  themes,
  theme,
  onThemeChange,
  colorPalettes,
  palette,
  setPalette,
  themeOverrides,
  themeDefaults,
  onTokensChange,
  onReset,
}: ThemeEditorFormProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Theme select removed per request; Color Themes picker remains below */}

      {/* Prebuilt color theme picker — moved here for prominence under theme select */}
      <ColorThemeSelector
        tokens={{ ...(themeDefaults as Record<string, string>), ...(themeOverrides as Record<string, string>) }}
        baseTokens={themeDefaults as any}
        onChange={onTokensChange as any}
      />

      <div className="space-y-2">
        <h3 className="font-medium">Color Palette</h3>
        <div className="flex flex-wrap gap-2">
          {colorPalettes.map((p) => {
            const c1 = checkContrast(p.colors["--color-fg"], p.colors["--color-bg"]);
            const c2 = checkContrast(
              p.colors["--color-primary-fg"],
              p.colors["--color-primary"]
            );
            const warn = c1 < MIN_CONTRAST || c2 < MIN_CONTRAST;
            return (
              <div key={p.name} className="relative">
                <Button
                  onClick={() => setPalette(p.name)}
                  className="h-10 w-10 p-0"
                  aria-label={p.name}
                  data-cy={`palette-${p.name}`}
                  color={p.name === palette ? "primary" : "default"}
                  tone={p.name === palette ? "soft" : "outline"}
                >
                  <div
                    className="grid h-full w-full grid-cols-3 grid-rows-2 overflow-hidden rounded"
                    // Provide hard fallbacks for contrast in dark mode
                    style={{
                      backgroundColor: "hsl(var(--surface-2, var(--color-bg)))",
                      borderColor: "hsl(var(--border-2, var(--color-fg, 0 0% 93%) / 0.22))",
                    }}
                  >
                    {Object.values(p.colors)
                      .slice(0, 6)
                      .map((c, i) => (
                        <span
                          key={i}
                          className="h-full w-full"
                          style={{ backgroundColor: `hsl(${c})` }}
                        />
                      ))}
                  </div>
                </Button>
                {warn && (
                  <span className="absolute -top-1 -right-1 rounded bg-warning-soft px-1 text-xs text-foreground">
                    Low contrast
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ThemeSpectrum />

      <StyleEditor
        tokens={themeOverrides}
        baseTokens={themeDefaults}
        onChange={onTokensChange}
        showPresets={false}
        showSearch={false}
        showExtras={false}
      />
      <div className="flex justify-start">
        <Button data-cy="reset-theme" variant="outline" onClick={onReset}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
