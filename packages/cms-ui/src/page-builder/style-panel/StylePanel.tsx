"use client";

import { useTranslations } from "@acme/i18n";
import useContrastWarnings from "@acme/ui/hooks/useContrastWarnings";

import ColorEditor from "../ColorEditor";
import EffectsEditor from "../EffectsEditor";
import PresetGallery from "../PresetGallery";
import StylePreviewCard from "../StylePreviewCard";
import TypographyEditor from "../TypographyEditor";

import CursorSection from "./CursorSection";
import PresetManager from "./PresetManager";
import TextThemeSelector from "./TextThemeSelector";
import type { StylePanelProps } from "./types";
import useStylePanelState from "./useStylePanelState";

export default function StylePanel({ component, handleInput }: StylePanelProps) {
  const state = useStylePanelState({ component, handleInput });
  const warning = useContrastWarnings(state.color.fg ?? "", state.color.bg ?? "");
  const t = useTranslations();
  // Basic interpolation helper so tests using a minimal i18n mock still see substituted labels
  const fmt = (template: string, bp: string) => template.replace("{bp}", bp);

  const cursor = ((component as Record<string, unknown>).cursor as string | undefined) ?? undefined;
  const cursorUrl = ((component as Record<string, unknown>).cursorUrl as string | undefined) ?? undefined;
  const setExtra = (field: string, value: unknown) =>
    (handleInput as unknown as (k: string, v: unknown) => void)(field, value);

  return (
    <div className="space-y-2">
      <CursorSection
        cursor={cursor}
        cursorUrl={cursorUrl}
        onCursorChange={(value) => setExtra("cursor", value)}
        onCursorUrlChange={(value) => setExtra("cursorUrl", value)}
      />

      <PresetManager
        presets={state.presets}
        customPresets={state.customPresets}
        selectedCustom={state.selectedCustom}
        onApplyPreset={state.applyPreset}
        onApplyCustomPreset={state.applyCustomPreset}
        onCopy={state.copyStyles}
        onPaste={state.pasteStyles}
        onSavePreset={() => {
          state.saveCurrentAsPreset();
        }}
        onRenamePreset={state.renameSelected}
        onDuplicatePreset={state.duplicateSelected}
        onMovePreset={state.moveSelected}
        onRemovePreset={state.removeSelected}
        exportAllPresets={state.exportJSON}
        importPresets={state.importJSON}
      />

      <PresetGallery title={t("cms.style.presets.quick")} presets={state.presets} onApply={state.applyPreset} />
      <PresetGallery title={t("cms.style.presets.custom")} presets={state.customPresets} onApply={state.applyCustomPreset} />

      <StylePreviewCard
        effects={state.effects}
        hoverScale={((component as Record<string, unknown>).hoverScale as number | undefined) ?? undefined}
        hoverOpacity={((component as Record<string, unknown>).hoverOpacity as number | undefined) ?? undefined}
      />

      <ColorEditor
        values={{ fg: state.color.fg, bg: state.color.bg, border: state.color.border }}
        labels={{
          fg: t("cms.style.foreground") as string,
          bg: t("cms.style.background") as string,
          border: t("cms.style.border") as string,
        }}
        placeholder={t("cms.style.colorPlaceholder") as string}
        onChange={(key, value) => state.updateColor(key, value)}
      />

      <TextThemeSelector
        textThemes={state.textThemes}
        appliedTheme={state.appliedTextTheme}
        label={t("cms.style.textStyle") as string}
        customLabel={t("cms.theme.colorInput.customSwatchTitle") as string}
        onSelect={(themeId) => state.handleTextThemeSelect(themeId)}
      />

      <TypographyEditor
        base={state.typography}
        desktop={state.typographyDesktop}
        tablet={state.typographyTablet}
        mobile={state.typographyMobile}
        labels={{
          base: {
            fontFamily: t("cms.style.fontFamily") as string,
            fontSize: t("cms.style.fontSize") as string,
            fontWeight: t("cms.style.fontWeight") as string,
            lineHeight: t("cms.style.lineHeight") as string,
          },
          desktop: {
            heading: fmt(t("cms.style.typography.headingBp") as string, t("devices.desktop") as string),
            fontSize: fmt(t("cms.style.typography.fontSizeBp") as string, t("devices.desktop") as string),
            lineHeight: fmt(t("cms.style.typography.lineHeightBp") as string, t("devices.desktop") as string),
          },
          tablet: {
            heading: fmt(t("cms.style.typography.headingBp") as string, t("devices.tablet") as string),
            fontSize: fmt(t("cms.style.typography.fontSizeBp") as string, t("devices.tablet") as string),
            lineHeight: fmt(t("cms.style.typography.lineHeightBp") as string, t("devices.tablet") as string),
          },
          mobile: {
            heading: fmt(t("cms.style.typography.headingBp") as string, t("devices.mobile") as string),
            fontSize: fmt(t("cms.style.typography.fontSizeBp") as string, t("devices.mobile") as string),
            lineHeight: fmt(t("cms.style.typography.lineHeightBp") as string, t("devices.mobile") as string),
          },
        }}
        onBase={(key, value) => state.updateTypography(key, value)}
        onBp={(bp, key, value) => state.updateBreakpointTypography(bp, key, value)}
      />

      <div className="mt-3 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">{t("cms.style.effects")}</div>
        <EffectsEditor effects={state.effects} onChange={state.updateEffects} />
      </div>

      {warning ? (
        <p role="status" aria-live="polite" className="text-danger text-sm">
          {t("cms.style.lowContrast")}
        </p>
      ) : null}
    </div>
  );
}
