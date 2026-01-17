"use client";

import { Button } from "@acme/ui/components/atoms/shadcn";
import StyleEditor from "@acme/ui/components/cms/StyleEditor";
import { getContrast } from "@acme/ui/components/cms";
import type { TokenMap } from "@acme/ui/hooks/useTokenEditor";
import ThemeSpectrum from "@acme/ui/components/cms/ThemeSpectrum";
import ColorThemeSelector from "./ColorThemeSelector";
import { useTranslations } from "@acme/i18n";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives/Grid";
import { Inline } from "@acme/ui/components/atoms/primitives/Inline";

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
  themes: _themes,
  theme: _theme,
  onThemeChange: _onThemeChange,
  colorPalettes,
  palette,
  setPalette,
  themeOverrides,
  themeDefaults,
  onTokensChange,
  onReset,
}: ThemeEditorFormProps): React.JSX.Element {
  const t = useTranslations();
  const themeLabel = String(t("cms.theme.selectTheme"));
  const resolvedThemeLabel =
    themeLabel === "cms.theme.selectTheme" ? "Theme" : themeLabel;
  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1">
        <span>{resolvedThemeLabel}</span>
        <select
          className="border p-2"
          name="themeId"
          value={_theme}
          onChange={(e) => _onThemeChange(e.target.value)}
        >
          {_themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {/* Prebuilt color theme picker — moved here for prominence under theme select */}
      <ColorThemeSelector
        tokens={{
          ...(themeDefaults as Record<string, string>),
          ...(themeOverrides as Record<string, string>),
        } as TokenMap}
        baseTokens={themeDefaults as unknown as TokenMap}
        onChange={onTokensChange}
      />

      <div className="space-y-2">
        <h3 className="font-medium">{t("cms.theme.colorPalette")}</h3>
        <Inline gap={2}>
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
                  <DSGrid
                    cols={3}
                    gap={0}
                    className="h-full w-full grid-rows-2 overflow-hidden rounded"
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
                  </DSGrid>
                </Button>
                {warn && (
                  <span className="absolute -top-1 -right-1 rounded bg-warning-soft px-1 text-xs text-foreground">
                    {t("cms.style.lowContrast")}
                  </span>
                )}
              </div>
            );
          })}
        </Inline>
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
      <Inline className="justify-start">
        <Button data-cy="reset-theme" variant="outline" onClick={onReset}>
          {t("cms.theme.resetToDefaults")}
        </Button>
      </Inline>
    </div>
  );
}
