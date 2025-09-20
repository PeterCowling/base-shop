// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry, type BlockType } from "./cms/blocks";
import type { BlockRegistryEntry } from "./cms/blocks/types";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import type { CSSProperties, ReactNode } from "react";
import type { HistoryState } from "@acme/types";
import { cssVars } from "../utils/style";

export default function DynamicRenderer({
  components,
  locale,
  runtimeData,
  editor,
}: {
  components: PageComponent[];
  locale: Locale;
  runtimeData?: Partial<Record<BlockType, Record<string, unknown>>>;
  /** Optional editor metadata map (builder-only flags) */
  editor?: HistoryState["editor"];
}) {
  const renderBlock = (block: PageComponent): ReactNode => {
    // Skip rendering when hidden has been decorated for this viewport
    const blockRecord = block as Record<string, unknown>;
    if (blockRecord.hidden === true) return null;
    const entry = blockRegistry[block.type as BlockType];
    if (!entry) {
      console.warn(`Unknown component type: ${block.type}`);
      return null;
    }

    const { component: Comp, getRuntimeProps } =
      entry as BlockRegistryEntry<Record<string, unknown>>;

    const {
      id,
      type: _type,
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
      children: childBlocks,
      ...rest
    } = block as PageComponent & { children?: PageComponent[] };

    // Inline CSS variables based on style overrides
    let styleVars: CSSProperties = {};
    try {
      const raw = (blockRecord.styles as string | undefined) ?? "";
      const overrides = raw ? (JSON.parse(String(raw)) as any) : undefined;
      const vars = cssVars(overrides);
      styleVars = vars as CSSProperties;
    } catch {
      // ignore invalid style JSON
    }

    const style: CSSProperties = {
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
      ...(typeof blockRecord.zIndex === "number" ? { zIndex: blockRecord.zIndex as number } : {}),
      ...styleVars,
      // Apply inheritable typography props using CSS variables
      fontFamily: (styleVars as any)["--font-family"] ? ("var(--font-family)" as any) : undefined,
      fontSize: (styleVars as any)["--font-size"] || (styleVars as any)["--font-size-desktop"] || (styleVars as any)["--font-size-tablet"] || (styleVars as any)["--font-size-mobile"] ? ("var(--font-size)" as any) : undefined,
      lineHeight: (styleVars as any)["--line-height"] || (styleVars as any)["--line-height-desktop"] || (styleVars as any)["--line-height-tablet"] || (styleVars as any)["--line-height-mobile"] ? ("var(--line-height)" as any) : undefined,
    };

    // Per-breakpoint visibility classes from editor metadata (if provided)
    const hidden = (editor?.[id]?.hidden ?? []) as ("desktop" | "tablet" | "mobile")[];
    const hideClasses = [
      hidden.includes("desktop") ? "pb-hide-desktop" : "",
      hidden.includes("tablet") ? "pb-hide-tablet" : "",
      hidden.includes("mobile") ? "pb-hide-mobile" : "",
    ]
      .filter(Boolean)
      .join(" ");

    let extraProps: Record<string, unknown> = {};
    if (getRuntimeProps) {
      const runtime = getRuntimeProps(block, locale);
      extraProps = { ...extraProps, ...(runtime as Record<string, unknown>) };
    }

    if (runtimeData && runtimeData[block.type as BlockType]) {
      extraProps = {
        ...extraProps,
        ...runtimeData[block.type as BlockType],
      };
    }

    return (
      <div key={id} style={style} className={["pb-scope", hideClasses].filter(Boolean).join(" ") || undefined}>
        <Comp
          {...rest}
          {...extraProps}
          id={id}
          type={_type}
          locale={locale}
        >
          {childBlocks?.map((child: PageComponent) => renderBlock(child))}
        </Comp>
      </div>
    );
  };

  return <>{components.map((c) => renderBlock(c))}</>;
}
