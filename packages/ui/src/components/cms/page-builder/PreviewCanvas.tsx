"use client";

import type { CSSProperties } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import Block from "./Block";
import type { Locale } from "@acme/i18n/locales";
import { isHiddenForViewport } from "./state/layout/utils";

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
    <div
      id="canvas"
      ref={(node) => { if (canvasRef) (canvasRef as any).current = node; }}
      style={containerStyle}
      className="relative mx-auto flex flex-col gap-4"
    >
      {components
        .filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport))
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
          return (
            <div key={c.id} className={["pb-scope", hideClasses].filter(Boolean).join(" ") || undefined}>
              <Block component={{ ...(c as any), pbViewport: viewport } as any} locale={locale} />
            </div>
          );
        })}
    </div>
  );
}

