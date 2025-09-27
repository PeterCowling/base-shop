"use client";

import { useTranslations } from "@acme/i18n";
import useContrastWarnings from "../../../../hooks/useContrastWarnings";
import PresetGallery from "../PresetGallery";
import EffectsEditor from "../EffectsEditor";
import StylePreviewCard from "../StylePreviewCard";
import ColorEditor from "../ColorEditor";
import TypographyEditor from "../TypographyEditor";
import type { StylePanelProps } from "./types";
import useStylePanelState from "./useStylePanelState";
import CursorSection from "./CursorSection";
import PresetManager from "./PresetManager";
import TextThemeSelector from "./TextThemeSelector";

export default function StylePanel({ component, handleInput }: StylePanelProps) {
  const state = useStylePanelState({ component, handleInput });
  const warning = useContrastWarnings(state.color.fg ?? "", state.color.bg ?? "");
  const t = useTranslations();

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

      <PresetGallery title={/* i18n-exempt */ "Quick presets"} presets={state.presets} onApply={state.applyPreset} />
      <PresetGallery title={/* i18n-exempt */ "Custom presets"} presets={state.customPresets} onApply={state.applyCustomPreset} />

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
        customLabel={/* i18n-exempt */ "Custom"}
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
          desktop: { heading: /* i18n-exempt */ "Typography (Desktop)", fontSize: /* i18n-exempt */ "Font size (Desktop)", lineHeight: /* i18n-exempt */ "Line height (Desktop)" },
          tablet: { heading: /* i18n-exempt */ "Typography (Tablet)", fontSize: /* i18n-exempt */ "Font size (Tablet)", lineHeight: /* i18n-exempt */ "Line height (Tablet)" },
          mobile: { heading: /* i18n-exempt */ "Typography (Mobile)", fontSize: /* i18n-exempt */ "Font size (Mobile)", lineHeight: /* i18n-exempt */ "Line height (Mobile)" },
        }}
        onBase={(key, value) => state.updateTypography(key, value)}
        onBp={(bp, key, value) => state.updateBreakpointTypography(bp, key, value)}
      />

      <div className="mt-3 border-t pt-2">
        <div className="text-xs font-semibold text-muted-foreground">{/* i18n-exempt */}Effects</div>
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
