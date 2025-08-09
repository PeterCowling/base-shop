// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry } from "@ui";
import { PRODUCTS } from "@platform-core/src/products";
import type { PageComponent, SKU } from "@types";
import type { ReactNode, CSSProperties } from "react";

export default function DynamicRenderer({
  components,
}: {
  components: PageComponent[];
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

    return (
      <div key={id} style={style}>
        <Comp {...props} {...extraProps}>
          {children?.map((child: PageComponent) => renderBlock(child))}
        </Comp>
      </div>
    );
  };

  return <>{components.map((c) => renderBlock(c))}</>;
}

