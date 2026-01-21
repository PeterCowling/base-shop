"use client";

import { type CSSProperties,useCallback, useMemo } from "react";

import { extractTextThemes, type TextTheme,toCssValue } from "../textThemes";

import usePreviewTokens from "./usePreviewTokens";

export default function useTextThemesPreview() {
  const previewTokens = usePreviewTokens();
  const textThemes = useMemo(() => extractTextThemes(previewTokens), [previewTokens]);

  const buildPreviewStyle = useCallback((theme: TextTheme): CSSProperties => {
    const base = theme.tokens.typography ?? {};
    const style: CSSProperties = {};
    if (base.fontFamily) style.fontFamily = toCssValue(base.fontFamily);
    if (base.fontSize) style.fontSize = toCssValue(base.fontSize);
    if (base.fontWeight) style.fontWeight = toCssValue(base.fontWeight);
    if (base.lineHeight) style.lineHeight = toCssValue(base.lineHeight);
    return style;
  }, []);

  return { textThemes, buildPreviewStyle } as const;
}

