"use client";

import React from "react";
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";

/**
 * Provides accessibility configuration for @dnd-kit/core based on a locale.
 * Single purpose: build screen reader instructions and announcements.
 */
export default function useDndA11y(locale?: string) {
  return React.useMemo(() => {
    const L = locale ?? "en";
    const messages: Record<string, Record<string, string>> = {
      en: {
        picked: "Picked up", // i18n-exempt -- PB-000 internal SR copy
        moved: "Moved", // i18n-exempt -- PB-000 internal SR copy
        over: "over", // i18n-exempt -- PB-000 internal SR copy
        dropped: "Dropped", // i18n-exempt -- PB-000 internal SR copy
        into: "into", // i18n-exempt -- PB-000 internal SR copy
        canceled: "Canceled drag", // i18n-exempt -- PB-000 internal SR copy
        instructions:
          "To pick up an item, press space or enter. Use arrow keys to move. Press space or enter to drop, or escape to cancel.", // i18n-exempt -- PB-000 internal SR copy
      },
    };
    const t = (k: string) => (messages[L] || messages.en)[k] || k;
    return {
      screenReaderInstructions: {
        draggable: t("instructions"),
      },
      announcements: {
        onDragStart({ active }: DragStartEvent) {
          const dc = active?.data?.current as unknown;
          const label = (typeof (dc as { label?: unknown })?.label === 'string' ? (dc as { label?: string }).label : String(active?.id ?? 'item')); // i18n-exempt -- PB-000 fallback literal
          return `${t("picked")} ${label}`;
        },
        onDragMove({ active, over }: DragMoveEvent) {
          if (!over) return undefined;
          const a = active?.data?.current as unknown;
          const label = (typeof (a as { label?: unknown })?.label === 'string' ? (a as { label?: string }).label : String(active?.id ?? 'item')); // i18n-exempt -- PB-000 fallback literal
          const oc = over?.data?.current as unknown;
          const overLabel = (typeof (oc as { label?: unknown })?.label === 'string' ? (oc as { label?: string }).label : String(over?.id ?? 'target')); // i18n-exempt -- PB-000 fallback literal
          return `${t("moved")} ${label} ${t("over")} ${overLabel}`;
        },
        onDragOver({ active, over }: DragOverEvent) {
          if (!over) return undefined;
          const a = active?.data?.current as unknown;
          const label = (typeof (a as { label?: unknown })?.label === 'string' ? (a as { label?: string }).label : String(active?.id ?? 'item')); // i18n-exempt -- PB-000 fallback literal
          const oc = over?.data?.current as unknown;
          const overLabel = (typeof (oc as { label?: unknown })?.label === 'string' ? (oc as { label?: string }).label : String(over?.id ?? 'target')); // i18n-exempt -- PB-000 fallback literal
          return `${t("moved")} ${label} ${t("over")} ${overLabel}`;
        },
        onDragEnd({ active, over }: DragEndEvent) {
          const a = active?.data?.current as unknown;
          const label = (typeof (a as { label?: unknown })?.label === 'string' ? (a as { label?: string }).label : String(active?.id ?? 'item')); // i18n-exempt -- PB-000 fallback literal
          if (!over) return `${t("canceled")}`;
          const oc = over?.data?.current as unknown;
          const overLabel = (typeof (oc as { label?: unknown })?.label === 'string' ? (oc as { label?: string }).label : String(over?.id ?? 'target')); // i18n-exempt -- PB-000 fallback literal
          return `${t("dropped")} ${label} ${t("into")} ${overLabel}`;
        },
        onDragCancel() {
          return `${t("canceled")}`;
        },
      },
    } as const;
  }, [locale]);
}
