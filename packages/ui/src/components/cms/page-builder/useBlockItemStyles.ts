"use client";

import { useMemo } from "react";
import { computeBlockStyle } from "./utils/computeBlockStyle";
import type useBlockDimensions from "./useBlockDimensions";
import type useBlockDnD from "./useBlockDnD";
import type { BlockItemProps } from "./BlockItem.types";

type Props = BlockItemProps;

type DimensionValues = Pick<
  ReturnType<typeof useBlockDimensions>,
  "widthVal" | "heightVal" | "marginVal" | "paddingVal" | "leftVal" | "topVal"
>;

type Transform = ReturnType<typeof useBlockDnD>["transform"];

type Options = {
  component: Props["component"];
  parentId: Props["parentId"];
  flags: Record<string, unknown>;
  effZIndex: number | undefined;
  transform: Transform;
  dimensions: DimensionValues;
};

export default function useBlockItemStyles({
  component,
  parentId,
  flags,
  effZIndex,
  transform,
  dimensions,
}: Options) {
  return useMemo(() => {
    const baseStyle = computeBlockStyle({
      transform,
      zIndex: effZIndex,
      containerType: (component as any).containerType as string | undefined,
      containerName: (component as any).containerName as string | undefined,
      widthVal: dimensions.widthVal,
      heightVal: dimensions.heightVal,
      marginVal: dimensions.marginVal,
      paddingVal: dimensions.paddingVal,
      position: component.position,
      leftVal: dimensions.leftVal,
      topVal: dimensions.topVal,
      dockX: (component as any).dockX as any,
      dockY: (component as any).dockY as any,
      responsiveBehavior: (flags as any)?.responsiveBehavior as any,
    });

    return {
      ...baseStyle,
      ...getPinnedStyle(parentId, flags),
      ...getCursorStyle(component),
    } as const;
  }, [
    component,
    dimensions.heightVal,
    dimensions.leftVal,
    dimensions.marginVal,
    dimensions.paddingVal,
    dimensions.topVal,
    dimensions.widthVal,
    effZIndex,
    flags,
    parentId,
    transform,
  ]);
}

function getPinnedStyle(parentId: Props["parentId"], flags: Record<string, unknown>) {
  const isTopLevel = !parentId;
  const pinned = !!(flags as any)?.pinned;
  if (!isTopLevel || !pinned) return {};
  return { position: "sticky", top: 0, zIndex: 30 } as const;
}

function getCursorStyle(component: Props["component"]) {
  const cur = (component as any).cursor as string | undefined;
  const url = (component as any).cursorUrl as string | undefined;
  if (!cur || cur === "default") return {};
  if (cur === "custom" && url) return { cursor: `url(${url}), auto` } as const;
  return { cursor: cur } as const;
}
