// Type definitions for structured route content

import type { LinkedCopy, RouteContentValue } from "@/lib/how-to-get-here/schema";

export interface RouteMetaBlock {
  title: string;
  description: string;
}

export interface RouteHeaderBlock {
  title: string;
  description: string;
}

export interface RouteCalloutBlock {
  copy?: string;
  body?: string | LinkedCopy;
}

export interface RouteSectionBlock {
  title?: string;
  body?: string | LinkedCopy;
  link?: string | LinkedCopy;
  cta?: string | LinkedCopy;
  intro?: string | LinkedCopy;
  points?: (string | RouteContentValue)[];
  list?: (string | RouteContentValue)[];
}

export interface StructuredRouteContent {
  meta: RouteMetaBlock;
  header?: RouteHeaderBlock;
  hero?: RouteHeaderBlock;
  intro?: RouteCalloutBlock;
  cta?: RouteCalloutBlock;
  sections?: Record<string, RouteSectionBlock>;
  [key: string]: RouteContentValue | RouteMetaBlock | RouteHeaderBlock | RouteCalloutBlock | Record<string, RouteSectionBlock> | undefined;
}

export function isStructuredRouteContent(
  content: unknown,
): content is StructuredRouteContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "meta" in content &&
    typeof (content as Record<string, unknown>).meta === "object" &&
    (content as Record<string, unknown>).meta !== null &&
    ("header" in content || "hero" in content)
  );
}
