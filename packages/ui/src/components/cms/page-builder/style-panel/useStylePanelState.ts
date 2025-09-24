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

  const buildNextOverrides = useCallback((): StyleOverrides => {
    const latest = parseOverrides(component.styles);
    const next: StyleOverrides = { ...latest };
    if (latest.color) {
      next.color = { ...latest.color };
    }
    if (latest.typography) {
      next.typography = { ...latest.typography };
    }
    if (latest.typographyDesktop) {
      next.typographyDesktop = { ...latest.typographyDesktop };
    }
    if (latest.typographyTablet) {
      next.typographyTablet = { ...latest.typographyTablet };
    }
    if (latest.typographyMobile) {
      next.typographyMobile = { ...latest.typographyMobile };
    }
    if (latest.effects) {
      next.effects = { ...latest.effects };
    }
    return next;
  }, [component]);

  const commitOverrides = useCallback(
    (next: StyleOverrides) => {
      handleInput("styles", JSON.stringify(next));
    },
    [handleInput],
  );

  const updateGroup = useCallback(
    (group: "color" | "typography", key: string, value: string) => {
      const next = buildNextOverrides();
      const nextColor = { ...(next.color ?? {}) };
      const nextTypography = { ...(next.typography ?? {}) };
      if (group === "color") {
        next.color = { ...nextColor, [key]: value };
        next.typography = nextTypography;
      } else {
        next.color = nextColor;
        next.typography = { ...nextTypography, [key]: value };
      }
      commitOverrides(next);
      trackEvent("stylepanel:update", { group, key });
    },
    [buildNextOverrides, commitOverrides],
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
      const next = buildNextOverrides();
      const field = `typography${bp}` as const;
      const current = (next[field] ?? {}) as Partial<Record<BreakpointKey, string>>;
      next[field] = {
        ...current,
        [key]: value,
      } as NonNullable<StyleOverrides[typeof field]>;
      commitOverrides(next);
      trackEvent("stylepanel:update", { group: `typography-${bp.toLowerCase()}` as string, key });
    },
    [buildNextOverrides, commitOverrides],
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = defaultEffectPresets.find((p) => p.id === presetId);
      if (!preset) return;
      const next = buildNextOverrides();
      if (preset.value.color) {
        next.color = { ...(next.color ?? {}), ...preset.value.color };
      }
      if (preset.value.typography) {
        next.typography = { ...(next.typography ?? {}), ...preset.value.typography };
      }
      commitOverrides(next);
      trackEvent("stylepanel:preset", { id: presetId });
    },
    [buildNextOverrides, commitOverrides],
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
      const next = buildNextOverrides();
      next.effects = { ...(next.effects ?? {}), ...(preset.value.effects ?? {}) };
      commitOverrides(next);
      setSelectedCustom(presetId);
      trackEvent("stylepanel:apply-custom-preset", { id: presetId });
    },
    [customPresets, buildNextOverrides, commitOverrides, setSelectedCustom],
  );

  const copyStyles = useCallback(() => {
    const snapshot = buildNextOverrides();
    const toCopy: StyleOverrides = {
      color: { ...(snapshot.color ?? {}) },
      typography: { ...(snapshot.typography ?? {}) },
      typographyDesktop: { ...(snapshot.typographyDesktop ?? {}) },
      typographyTablet: { ...(snapshot.typographyTablet ?? {}) },
      typographyMobile: { ...(snapshot.typographyMobile ?? {}) },
      effects: { ...(snapshot.effects ?? {}) },
    };
    clipboard.set(toCopy);
    trackEvent("stylepanel:copy");
  }, [buildNextOverrides]);

  const pasteStyles = useCallback(() => {
    const data = clipboard.get();
    if (!data) return;
    const next = buildNextOverrides();
    if (data.color) {
      next.color = { ...(next.color ?? {}), ...data.color };
    }
    if (data.typography) {
      next.typography = { ...(next.typography ?? {}), ...data.typography };
    }
    if (data.typographyDesktop) {
      next.typographyDesktop = { ...(next.typographyDesktop ?? {}), ...data.typographyDesktop };
    }
    if (data.typographyTablet) {
      next.typographyTablet = { ...(next.typographyTablet ?? {}), ...data.typographyTablet };
    }
    if (data.typographyMobile) {
      next.typographyMobile = { ...(next.typographyMobile ?? {}), ...data.typographyMobile };
    }
    if (data.effects) {
      next.effects = { ...(next.effects ?? {}), ...data.effects };
    }
    commitOverrides(next);
    trackEvent("stylepanel:paste");
  }, [buildNextOverrides, commitOverrides]);

  const updateEffects = useCallback(
    (key: EffectKey, value: string) => {
      const next = buildNextOverrides();
      next.effects = { ...(next.effects ?? {}), [key]: value };
      commitOverrides(next);
      trackEvent("stylepanel:update", { group: "effects", key });
    },
    [buildNextOverrides, commitOverrides],
  );

  const handleTextThemeSelect = useCallback(
    (themeId: string) => {
      const latest = parseOverrides(component.styles);
      if (!themeId) {
        const cleared = clearTextThemeFromOverrides(latest);
        commitOverrides(cleared);
        trackEvent("stylepanel:text-theme", { id: "__custom__" });
        return;
      }
      const theme = textThemes.find((t) => t.id === themeId);
      if (!theme) return;
      const next = applyTextThemeToOverrides(latest, theme);
      commitOverrides(next);
      trackEvent("stylepanel:text-theme", { id: theme.id });
    },
    [component, commitOverrides, textThemes],
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
