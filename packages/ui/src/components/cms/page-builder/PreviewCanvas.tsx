"use client";

import type { CSSProperties } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import Block from "./Block";
import type { Locale } from "@acme/i18n/locales";
import { isHiddenForViewport } from "./state/layout/utils";
import { Stack } from "../../atoms/primitives/Stack";
import { cn } from "../../../utils/style/cn";

export default function PreviewCanvas({
  components,
  canvasRef,
  containerStyle,
  editor,
  viewport,
  locale,
}: {
  components: PageComponent[];
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  containerStyle: CSSProperties;
  editor?: HistoryState["editor"];
  viewport: "desktop" | "tablet" | "mobile";
  locale: Locale;
}) {
  return (
    <Stack
      id="canvas"
      ref={(node) => {
        if (canvasRef) canvasRef.current = node;
      }}
      style={containerStyle}
      // i18n-exempt: className contains only CSS utility tokens
      className={cn("relative mx-auto")}
      gap={4}
    >
      {components
        .filter((c) => !isHiddenForViewport(c.id, editor, (c as Partial<{ hidden?: boolean }>).hidden, viewport))
        .map((c) => {
          const flags = (editor ?? {})[c.id];
          const hidden = (flags?.hidden ?? []) as ("desktop" | "tablet" | "mobile")[];
          const hideClasses = [
            hidden.includes("desktop") ? "pb-hide-desktop" : "",
            hidden.includes("tablet") ? "pb-hide-tablet" : "",
            hidden.includes("mobile") ? "pb-hide-mobile" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const withViewport = { ...(c as PageComponent), pbViewport: viewport } as PageComponent;
          return (
            <div key={c.id} className={["pb-scope", hideClasses].filter(Boolean).join(" ") || undefined}>
              <Block component={withViewport} locale={locale} />
            </div>
          );
        })}
    </Stack>
  );
}
