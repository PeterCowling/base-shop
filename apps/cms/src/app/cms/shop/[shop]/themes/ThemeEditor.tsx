// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx

"use client";
import { Button } from "@/components/atoms/shadcn";
import { Alert } from "@/components/atoms";
import { Inline } from "@ui/components/atoms/primitives";
import { useTranslations } from "@acme/i18n";
import ThemePreview from "./ThemePreview";
import PalettePicker from "./PalettePicker";
import TypographySettings from "./TypographySettings";
import ThemeSelector from "./ThemeSelector";
import PresetControls from "./PresetControls";
import { useThemeEditor } from "./useThemeEditor";
import BrandIntensitySelector from "./BrandIntensitySelector";
import PalettePeek from "./PalettePeek";

export { default as ThemePreview } from "./ThemePreview";
export { default as PalettePicker } from "./PalettePicker";
export { default as TypographySettings } from "./TypographySettings";

interface Props {
  shop: string;
  themes: string[];
  tokensByTheme: Record<string, Record<string, string>>;
  initialTheme: string;
  initialOverrides: Record<string, string>;
  presets: string[];
}

export default function ThemeEditor(props: Props) {
  const t = useTranslations();
  const {
    theme,
    availableThemes,
    brandIntensity,
    setBrandIntensity,
    presetName,
    setPresetName,
    handleSavePreset,
    presetThemes,
    handleDeletePreset,
    contrastWarnings,
    overrides,
    handleOverrideChange,
    previewTokens,
    handleTokenSelect,
    groupedTokens,
    handleReset,
    handleGroupReset,
    overrideRefs,
    mergedTokens,
    textTokenKeys,
    bgTokenKeys,
    handleWarningChange,
    tokensByThemeState,
    handleThemeChange,
    handleResetAll,
  } = useThemeEditor(props);

  return (
    <div className="space-y-4">
      <ThemeSelector
        themes={availableThemes}
        value={theme}
        onChange={handleThemeChange}
      />
      <PalettePeek
        themes={availableThemes}
        value={theme}
        onChange={(t) =>
          handleThemeChange({ target: { value: t } } as unknown as React.ChangeEvent<HTMLSelectElement>)
        }
        hasWarnings={Object.keys(contrastWarnings).length > 0}
      />
      <PresetControls
        presetName={presetName}
        setPresetName={setPresetName}
        handleSavePreset={handleSavePreset}
        handleDeletePreset={handleDeletePreset}
        isPresetTheme={presetThemes.includes(theme)}
      />
      <BrandIntensitySelector value={brandIntensity} onChange={setBrandIntensity} />
      {Object.keys(contrastWarnings).length > 0 && (
        <Alert variant="warning" tone="soft" title={t("cms.themes.contrastWarnings")}>
          <ul className="list-disc pl-4">
            {Object.values(contrastWarnings).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}
      <ThemePreview
        overrides={overrides}
        onChange={handleOverrideChange}
        previewTokens={previewTokens}
        themeDefaults={tokensByThemeState[theme]}
        onTokenSelect={handleTokenSelect}
      />
      <PalettePicker
        groupedTokens={groupedTokens}
        overrides={overrides}
        handleOverrideChange={handleOverrideChange}
        handleReset={handleReset}
        handleGroupReset={handleGroupReset}
        overrideRefs={overrideRefs}
        mergedTokens={mergedTokens}
        textTokenKeys={textTokenKeys}
        bgTokenKeys={bgTokenKeys}
        handleWarningChange={handleWarningChange}
        onTokenSelect={handleTokenSelect}
      />
      <TypographySettings
        tokens={tokensByThemeState[theme]}
        overrides={overrides}
        handleOverrideChange={handleOverrideChange}
        handleReset={handleReset}
        overrideRefs={overrideRefs}
      />
      <Inline gap={2}>
        <Button type="button" onClick={handleResetAll}>
          {t("cms.themes.resetAllOverrides")}
        </Button>
      </Inline>
    </div>
  );
}
