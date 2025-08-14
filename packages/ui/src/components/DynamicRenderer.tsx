// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry } from "@ui/components/cms/blocks";
import type { BlockRegistryEntry } from "@ui/components/cms/blocks/types";
import type { Locale } from "@/i18n/locales";
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

    type Block = Extract<PageComponent, { type: typeof block.type }>;
    const { component: Comp, getRuntimeProps } = entry as BlockRegistryEntry<Block>;

    const {
      id,
      type: _type,
      children,
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
      ...rest
    } = block as Block;

    const style: CSSProperties = {
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
    };

    type BlockProps = Omit<
      Block,
      | "id"
      | "type"
      | "children"
      | "width"
      | "height"
      | "margin"
      | "padding"
      | "position"
      | "top"
      | "left"
    >;
    const props = rest as BlockProps;

    let extraProps: Partial<BlockProps> = {};
    if (getRuntimeProps) {
      const runtime = getRuntimeProps(block, locale);
      extraProps = { ...extraProps, ...(runtime as Partial<BlockProps>) };
    }

    if (runtimeData && runtimeData[block.type]) {
      extraProps = {
        ...extraProps,
        ...(runtimeData[block.type] as Partial<BlockProps>),
      };
    }

    return (
      <div key={id} style={style}>
        <Comp {...props} {...extraProps} locale={locale}>
          {children?.map((child) => renderBlock(child))}
        </Comp>
      </div>
    );
  };

  return <>{components.map((c) => renderBlock(c))}</>;
}
