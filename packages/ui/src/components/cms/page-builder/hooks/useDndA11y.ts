"use client";

import React from "react";

/**
 * Provides accessibility configuration for @dnd-kit/core based on a locale.
 * Single purpose: build screen reader instructions and announcements.
 */
export default function useDndA11y(locale?: string) {
  return React.useMemo(() => {
    const L = locale ?? "en";
    const messages: Record<string, Record<string, string>> = {
      en: {
        picked: "Picked up",
        moved: "Moved",
        over: "over",
        dropped: "Dropped",
        into: "into",
        canceled: "Canceled drag",
        instructions:
          "To pick up an item, press space or enter. Use arrow keys to move. Press space or enter to drop, or escape to cancel.",
      },
    };
    const t = (k: string) => (messages[L] || messages.en)[k] || k;
    return {
      screenReaderInstructions: {
        draggable: t("instructions"),
      },
      announcements: {
        onDragStart({ active }: { active: any }) {
          const label = (active?.data?.current as any)?.label || String(active?.id ?? "item");
          return `${t("picked")} ${label}`;
        },
        onDragMove({ active, over }: { active: any; over: any }) {
          if (!over) return undefined;
          const a = active?.data?.current as any;
          const label = a?.label || String(active?.id ?? "item");
          const overLabel = (over?.data?.current as any)?.label || String(over?.id ?? "target");
          return `${t("moved")} ${label} ${t("over")} ${overLabel}`;
        },
        onDragOver({ active, over }: { active: any; over: any }) {
          if (!over) return undefined;
          const a = active?.data?.current as any;
          const label = a?.label || String(active?.id ?? "item");
          const overLabel = (over?.data?.current as any)?.label || String(over?.id ?? "target");
          return `${t("moved")} ${label} ${t("over")} ${overLabel}`;
        },
        onDragEnd({ active, over }: { active: any; over: any }) {
          const a = active?.data?.current as any;
          const label = a?.label || String(active?.id ?? "item");
          if (!over) return `${t("canceled")}`;
          const overLabel = (over?.data?.current as any)?.label || String(over?.id ?? "target");
          return `${t("dropped")} ${label} ${t("into")} ${overLabel}`;
        },
        onDragCancel() {
          return `${t("canceled")}`;
        },
      },
    } as const;
  }, [locale]);
}

