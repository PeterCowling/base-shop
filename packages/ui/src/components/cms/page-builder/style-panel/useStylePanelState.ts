import { useCallback, useMemo } from "react";
import type { PageComponent } from "@acme/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { defaultEffectPresets } from "../style/effectPresets";
import { getStyleClipboard, setStyleClipboard } from "../style/styleClipboard";
import useCustomPresets from "../style/useCustomPresets";
import usePreviewTokens from "../hooks/usePreviewTokens";
import {
  applyTextThemeToOverrides,
  clearTextThemeFromOverrides,
  extractTextThemes,
  getAppliedTextTheme,
} from "../textThemes";
import type { StylePanelProps } from "./types";
import { trackEvent } from "./telemetry";

const clipboard = { get: getStyleClipboard, set: setStyleClipboard } as const;

const parseOverrides = (styles: PageComponent["styles"]): StyleOverrides => {
  if (!styles) return {};
  try {
    return JSON.parse(String(styles));
  } catch {
    return {};
  }
};

type Breakpoint = "Desktop" | "Tablet" | "Mobile";
type BreakpointKey = "fontSize" | "lineHeight";
type EffectKey = keyof NonNullable<StyleOverrides["effects"]>;

export default function useStylePanelState({ component, handleInput }: StylePanelProps) {
  const overrides = parseOverrides(component.styles);
  const color = (overrides.color ?? {}) as NonNullable<StyleOverrides["color"]>;
  const typography = (overrides.typography ?? {}) as NonNullable<StyleOverrides["typography"]>;
  const typographyDesktop = (overrides.typographyDesktop ?? {}) as NonNullable<StyleOverrides["typographyDesktop"]>;
  const typographyTablet = (overrides.typographyTablet ?? {}) as NonNullable<StyleOverrides["typographyTablet"]>;
  const typographyMobile = (overrides.typographyMobile ?? {}) as NonNullable<StyleOverrides["typographyMobile"]>;
  const effects = (overrides.effects ?? {}) as NonNullable<StyleOverrides["effects"]>;

  const previewTokens = usePreviewTokens();
  const textThemes = useMemo(() => extractTextThemes(previewTokens), [previewTokens]);
  const appliedTextTheme = useMemo(
    () => getAppliedTextTheme(overrides, textThemes),
    [overrides, textThemes],
  );

  const updateGroup = useCallback(
    (group: "color" | "typography", key: string, value: string) => {
      const next: StyleOverrides = {
        color: { ...color },
        typography: { ...typography },
      };
      if (group === "color") {
        next.color = { ...color, [key]: value };
      } else {
        next.typography = { ...typography, [key]: value };
      }
      handleInput("styles", JSON.stringify(next));
      trackEvent("stylepanel:update", { group, key });
    },
    [color, typography, handleInput],
  );

  const updateColor = useCallback(
    (key: string, value: string) => {
      updateGroup("color", key, value);
    },
    [updateGroup],
  );

  const updateTypography = useCallback(
    (key: string, value: string) => {
      updateGroup("typography", key, value);
    },
    [updateGroup],
  );

  const updateBreakpointTypography = useCallback(
    (bp: Breakpoint, key: BreakpointKey, value: string) => {
      const next: StyleOverrides = {
        color: { ...color },
        typography: { ...typography },
        typographyDesktop: { ...typographyDesktop },
        typographyTablet: { ...typographyTablet },
        typographyMobile: { ...typographyMobile },
      };
      const field = `typography${bp}` as const;
      (next as Record<string, unknown>)[field] = {
        ...(next as Record<string, Record<string, string>>)[field],
        [key]: value,
      };
      handleInput("styles", JSON.stringify(next));
      trackEvent("stylepanel:update", { group: `typography-${bp.toLowerCase()}` as string, key });
    },
    [color, typography, typographyDesktop, typographyTablet, typographyMobile, handleInput],
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = defaultEffectPresets.find((p) => p.id === presetId);
      if (!preset) return;
      const next: StyleOverrides = {
        color: { ...color, ...(preset.value.color ?? {}) },
        typography: { ...typography, ...(preset.value.typography ?? {}) },
        typographyDesktop: { ...typographyDesktop },
        typographyTablet: { ...typographyTablet },
        typographyMobile: { ...typographyMobile },
        effects: { ...effects },
      };
      handleInput("styles", JSON.stringify(next));
      trackEvent("stylepanel:preset", { id: presetId });
    },
    [color, typography, typographyDesktop, typographyTablet, typographyMobile, effects, handleInput],
  );

  const {
    customPresets,
    selectedCustom,
    setSelectedCustom,
    saveCurrentAsPreset,
    removeSelected,
    renameSelected,
    duplicateSelected,
    moveSelected,
    exportJSON,
    importJSON,
  } = useCustomPresets(effects);

  const applyCustomPreset = useCallback(
    (presetId: string) => {
      const preset = customPresets.find((p) => p.id === presetId);
      if (!preset) return;
      const next: StyleOverrides = {
        color: { ...color },
        typography: { ...typography },
        typographyDesktop: { ...typographyDesktop },
        typographyTablet: { ...typographyTablet },
        typographyMobile: { ...typographyMobile },
        effects: { ...effects, ...(preset.value.effects ?? {}) },
      };
      handleInput("styles", JSON.stringify(next));
      setSelectedCustom(presetId);
      trackEvent("stylepanel:apply-custom-preset", { id: presetId });
    },
    [customPresets, color, typography, typographyDesktop, typographyTablet, typographyMobile, effects, handleInput, setSelectedCustom],
  );

  const copyStyles = useCallback(() => {
    const toCopy: StyleOverrides = {
      color: { ...color },
      typography: { ...typography },
      typographyDesktop: { ...typographyDesktop },
      typographyTablet: { ...typographyTablet },
      typographyMobile: { ...typographyMobile },
      effects: { ...effects },
    };
    clipboard.set(toCopy);
    trackEvent("stylepanel:copy");
  }, [color, typography, typographyDesktop, typographyTablet, typographyMobile, effects]);

  const pasteStyles = useCallback(() => {
    const data = clipboard.get();
    if (!data) return;
    const next: StyleOverrides = {
      color: { ...color, ...(data.color ?? {}) },
      typography: { ...typography, ...(data.typography ?? {}) },
      typographyDesktop: { ...typographyDesktop, ...(data.typographyDesktop ?? {}) },
      typographyTablet: { ...typographyTablet, ...(data.typographyTablet ?? {}) },
      typographyMobile: { ...typographyMobile, ...(data.typographyMobile ?? {}) },
      effects: { ...effects, ...(data.effects ?? {}) },
    };
    handleInput("styles", JSON.stringify(next));
    trackEvent("stylepanel:paste");
  }, [color, typography, typographyDesktop, typographyTablet, typographyMobile, effects, handleInput]);

  const updateEffects = useCallback(
    (key: EffectKey, value: string) => {
      const next: StyleOverrides = {
        color: { ...color },
        typography: { ...typography },
        typographyDesktop: { ...typographyDesktop },
        typographyTablet: { ...typographyTablet },
        typographyMobile: { ...typographyMobile },
        effects: { ...effects, [key]: value },
      };
      handleInput("styles", JSON.stringify(next));
      trackEvent("stylepanel:update", { group: "effects", key });
    },
    [color, typography, typographyDesktop, typographyTablet, typographyMobile, effects, handleInput],
  );

  const handleTextThemeSelect = useCallback(
    (themeId: string) => {
      if (!themeId) {
        const cleared = clearTextThemeFromOverrides(overrides);
        handleInput("styles", JSON.stringify(cleared));
        trackEvent("stylepanel:text-theme", { id: "__custom__" });
        return;
      }
      const theme = textThemes.find((t) => t.id === themeId);
      if (!theme) return;
      const next = applyTextThemeToOverrides(overrides, theme);
      handleInput("styles", JSON.stringify(next));
      trackEvent("stylepanel:text-theme", { id: theme.id });
    },
    [handleInput, overrides, textThemes],
  );

  return {
    overrides,
    color,
    typography,
    typographyDesktop,
    typographyTablet,
    typographyMobile,
    effects,
    presets: defaultEffectPresets,
    customPresets,
    selectedCustom,
    setSelectedCustom,
    saveCurrentAsPreset,
    removeSelected,
    renameSelected,
    duplicateSelected,
    moveSelected,
    exportJSON,
    importJSON,
    textThemes,
    appliedTextTheme,
    updateColor,
    updateTypography,
    updateBreakpointTypography,
    applyPreset,
    applyCustomPreset,
    copyStyles,
    pasteStyles,
    updateEffects,
    handleTextThemeSelect,
  } as const;
}
