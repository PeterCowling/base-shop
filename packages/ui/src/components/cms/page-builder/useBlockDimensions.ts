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
  const marginVal =
    (component[marginKey as keyof PageComponent] as string | undefined) ??
    component.margin;
  const paddingVal =
    (component[paddingKey as keyof PageComponent] as string | undefined) ??
    component.padding;

  return {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
  } as const;
}

