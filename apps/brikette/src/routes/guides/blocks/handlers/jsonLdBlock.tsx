/**
 * JSON-LD block handler.
 */
import { Children, createElement, Fragment, isValidElement, type ReactNode } from "react";

import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { JsonLdBlockOptions } from "../types";
import { resolveHeadRenderer } from "../utils/moduleResolver";
import { hasDefaultExportFunction } from "../utils/stringHelpers";

import type { BlockAccumulator } from "./BlockAccumulator";

export function applyJsonLdBlock(acc: BlockAccumulator, options: JsonLdBlockOptions): void {
  if (!options?.module) {
    acc.warn(`jsonLd block requires a module option`);
    return;
  }
  const renderer = resolveHeadRenderer(options.module, options.exportName);
  if (!renderer) {
    acc.warn(`jsonLd block module "${options.module}" could not be resolved`);
    return;
  }
  acc.addSlot("head", (context: GuideSeoTemplateContext) => {
    try {
      const node = renderer(context);
      if (node == null) return null;
      if (Array.isArray(node)) {
        return createElement(Fragment, null, Children.toArray(node));
      }
      if (isValidElement(node) || typeof node !== "object") {
        return node as ReactNode;
      }
      if (hasDefaultExportFunction(node)) {
        try {
          return node.default(context);
        } catch {
          return null;
        }
      }
      return node as ReactNode;
    } catch {
      return null;
    }
  });
}
