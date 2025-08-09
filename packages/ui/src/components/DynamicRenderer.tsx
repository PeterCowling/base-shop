// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry } from "@/components/cms/blocks";
import { PRODUCTS } from "@platform-core/src/products";
import type { PageComponent, SKU } from "@types";
import type { ReactNode, CSSProperties } from "react";

export default function DynamicRenderer({
  components,
  locale,
  data = {},
}: {
  components: PageComponent[];
  /** Active locale used for locale-aware components */
  locale?: string;
  /** Runtime data injected into CMS components (e.g. products, cart, etc.) */
  data?: Record<string, unknown>;
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

    // Locale + runtime data are passed through to every block so CMS layouts
    // can depend on environment-specific information.
    const extraProps: Record<string, unknown> = {
      locale,
      ...data,
    };

    // Provide sensible defaults for certain blocks when runtime data is absent.
    if (block.type === "ProductGrid" && !("skus" in extraProps)) {
      extraProps.skus = PRODUCTS as SKU[];
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

