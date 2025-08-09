// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry } from "@/components/cms/blocks";
import type { Locale } from "@/i18n/locales";
import { PRODUCTS } from "@platform-core/src/products";
import type { PageComponent, SKU } from "@types";
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
    const Comp = blockRegistry[block.type as keyof typeof blockRegistry];
    if (!Comp) {
      console.warn(`Unknown component type: ${block.type}`);
      return null;
    }

    const {
      id,
      children,
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
      ...props
    } = block as any;

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
    if (block.type === "ProductGrid") {
      extraProps = { skus: PRODUCTS as SKU[] };
    }

    if (runtimeData && runtimeData[block.type]) {
      extraProps = { ...extraProps, ...runtimeData[block.type] };
    }

    return (
      <div key={id} style={style}>
        <Comp {...props} {...extraProps} locale={locale}>
          {children?.map((child: PageComponent) => renderBlock(child))}
        </Comp>
      </div>
    );
  };

  return <>{components.map((c) => renderBlock(c))}</>;
}

