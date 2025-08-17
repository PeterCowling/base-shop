// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry } from "@ui/components/cms/blocks";
import type { BlockRegistryEntry } from "@ui/components/cms/blocks/types";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import type { CSSProperties, ReactNode } from "react";

export default function DynamicRenderer({
  components,
  locale,
  runtimeData,
}: {
  components: PageComponent[];
  locale: Locale;
  runtimeData?: Record<string, Record<string, unknown>>;
}) {
  const renderBlock = (block: PageComponent): ReactNode => {
    const entry = blockRegistry[block.type];
    if (!entry) {
      console.warn(`Unknown component type: ${block.type}`);
      return null;
    }

    const { component: Comp, getRuntimeProps } = entry as BlockRegistryEntry<any>;

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

    const style: CSSProperties = {
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
    };

    let extraProps: Record<string, unknown> = {};
    if (getRuntimeProps) {
      const runtime = getRuntimeProps(block, locale);
      extraProps = { ...extraProps, ...(runtime as Record<string, unknown>) };
    }

    if (runtimeData && runtimeData[block.type]) {
      extraProps = {
        ...extraProps,
        ...runtimeData[block.type],
      };
    }

    return (
      <div key={id} style={style}>
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
