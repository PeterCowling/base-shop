"use client";

import type { CSSProperties } from "react";
import type { TextTheme } from "../textThemes";
import { Inline, Stack } from "../../../atoms/primitives";

interface Props {
  textThemes: TextTheme[];
  buildPreviewStyle: (theme: TextTheme) => CSSProperties;
  onApply: (theme: TextTheme) => void;
}

export default function TextThemesList({ textThemes, buildPreviewStyle, onApply }: Props) {
  if (textThemes.length === 0) return null;
  return (
    <div className="space-y-2">
      <Inline className="justify-between" gap={2}>
        {/* i18n-exempt: Editor label for theme list */}
        <h4 className="font-semibold capitalize">Text Themes</h4>
        {/* i18n-exempt: Short instructional hint in builder */}
        <span className="text-xs text-muted-foreground">Apply to selected block</span>
      </Inline>
      <Stack gap={2}>
        {textThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className="rounded border p-2 text-start text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-10 min-w-10"
            onClick={() => onApply(theme)}
          >
            <Stack gap={1}>
              <span className="font-medium">{theme.label}</span>
              <span aria-hidden="true" className="truncate" style={buildPreviewStyle(theme)}>
                {/* i18n-exempt: Sample text for visual preview only */}
                The quick brown fox jumps over the lazy dog
              </span>
            </Stack>
          </button>
        ))}
      </Stack>
    </div>
  );
}
