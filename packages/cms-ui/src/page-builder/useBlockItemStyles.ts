"use client";

import { type CSSProperties,useMemo } from "react";

import type { PositioningProps } from "@acme/types/page/positioning";

import type { BlockItemProps } from "./BlockItem.types";
import type useBlockDimensions from "./useBlockDimensions";
import type useBlockDnD from "./useBlockDnD";
import { computeBlockStyle } from "./utils/computeBlockStyle";

type Props = BlockItemProps;

type DimensionValues = Pick<
  ReturnType<typeof useBlockDimensions>,
  "widthVal" | "heightVal" | "marginVal" | "paddingVal" | "leftVal" | "topVal"
>;

type Transform = ReturnType<typeof useBlockDnD>["transform"];

type Options = {
  component: Props["component"];
  parentId: Props["parentId"];
  flags: { pinned?: boolean; responsiveBehavior?: "none" | "scale-proportional" } | Record<string, unknown>;
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
}: Options): CSSProperties & { containerType?: string; containerName?: string; cursor?: string } {
  return useMemo(() => {
    const baseStyle = computeBlockStyle({
      transform,
      zIndex: effZIndex,
      containerType: (component as unknown as { containerType?: string }).containerType,
      containerName: (component as unknown as { containerName?: string }).containerName,
      widthVal: dimensions.widthVal,
      heightVal: dimensions.heightVal,
      marginVal: dimensions.marginVal,
      paddingVal: dimensions.paddingVal,
      position: component.position,
      leftVal: dimensions.leftVal,
      topVal: dimensions.topVal,
      dockX: (component as unknown as PositioningProps).dockX,
      dockY: (component as unknown as PositioningProps).dockY,
      responsiveBehavior: (flags as { responsiveBehavior?: "none" | "scale-proportional" }).responsiveBehavior,
    });

    return {
      ...baseStyle,
      ...getPinnedStyle(parentId, flags as { pinned?: boolean }),
      ...getCursorStyle(component as unknown as { cursor?: string; cursorUrl?: string }),
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

function getPinnedStyle(parentId: Props["parentId"], flags: { pinned?: boolean }) {
  const isTopLevel = !parentId;
  const pinned = !!flags?.pinned;
  if (!isTopLevel || !pinned) return {};
  return { position: "sticky", top: 0, zIndex: 30 } as const;
}

function getCursorStyle(component: { cursor?: string; cursorUrl?: string }) {
  const cur = component.cursor;
  const url = component.cursorUrl;
  if (!cur || cur === "default") return {};
  if (cur === "custom" && url) return { cursor: `url(${url}), auto` } as const;
  return { cursor: cur } as const;
}
