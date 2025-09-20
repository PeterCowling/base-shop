"use client";

import type { PageComponent } from "@acme/types";

interface Options {
  component: PageComponent;
  viewport: "desktop" | "tablet" | "mobile";
}

export default function useBlockDimensions({
  component,
  viewport,
}: Options) {
  const widthKey =
    viewport === "desktop"
      ? "widthDesktop"
      : viewport === "tablet"
        ? "widthTablet"
        : "widthMobile";
  const heightKey =
    viewport === "desktop"
      ? "heightDesktop"
      : viewport === "tablet"
        ? "heightTablet"
        : "heightMobile";
  const widthVal =
    (component[widthKey as keyof PageComponent] as string | undefined) ??
    component.width;
  const heightVal =
    (component[heightKey as keyof PageComponent] as string | undefined) ??
    component.height;
  const marginKey =
    viewport === "desktop"
      ? "marginDesktop"
      : viewport === "tablet"
        ? "marginTablet"
        : "marginMobile";
  const paddingKey =
    viewport === "desktop"
      ? "paddingDesktop"
      : viewport === "tablet"
        ? "paddingTablet"
        : "paddingMobile";
  const leftKey =
    viewport === "desktop"
      ? "leftDesktop"
      : viewport === "tablet"
        ? "leftTablet"
        : "leftMobile";
  const topKey =
    viewport === "desktop"
      ? "topDesktop"
      : viewport === "tablet"
        ? "topTablet"
        : "topMobile";
  const marginVal =
    (component[marginKey as keyof PageComponent] as string | undefined) ??
    component.margin;
  const paddingVal =
    (component[paddingKey as keyof PageComponent] as string | undefined) ??
    component.padding;
  const leftVal =
    (component[leftKey as keyof PageComponent] as string | undefined) ??
    component.left;
  const topVal =
    (component[topKey as keyof PageComponent] as string | undefined) ??
    component.top;

  return {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
    leftKey,
    topKey,
    leftVal,
    topVal,
  } as const;
}
