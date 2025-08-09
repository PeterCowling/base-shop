// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry } from "@/components/cms/blocks";
import type { PageComponent } from "@types";
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

    return (
      <div key={id} style={style}>
        <Comp {...props}>
          {children?.map((child: PageComponent) => renderBlock(child))}
        </Comp>
      </div>
    );
  };

  return <>{components.map((c) => renderBlock(c))}</>;
}

