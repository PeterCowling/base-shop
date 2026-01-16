/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route block renderer; guide route files own head tags per src/routes/AGENTS.md §3 */
import { Children, Fragment, createElement, isValidElement, type ReactNode } from "react";

import type { BlockAccumulator } from "../blockAccumulator";
import { getJsonLdModule } from "../moduleRegistry";
import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { JsonLdBlockOptions } from "../types";

type HeadRenderer = (context: GuideSeoTemplateContext) => ReactNode;

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
  acc.addSlot("head", (context) => {
    try {
      const node = renderer(context);
      if (node == null) return null;
      if (Array.isArray(node)) {
        return createElement(Fragment, null, Children.toArray(node));
      }
      if (isValidElement(node) || typeof node !== "object") {
        return node as ReactNode;
      }
      if (typeof node === "object" && node !== null) {
        const candidate = node as { default?: (ctx: GuideSeoTemplateContext) => ReactNode };
        if (typeof candidate.default === "function") {
          try {
            return candidate.default(context);
          } catch {
            return null;
          }
        }
      }
      return node as ReactNode;
    } catch {
      return null;
    }
  });
}

function resolveHeadRenderer(modulePath: string, exportName?: string): HeadRenderer | null {
  const matchedModule = getJsonLdModule(modulePath);
  if (!matchedModule) {
    return null;
  }

  const candidate = pickExport(matchedModule, exportName);
  if (typeof candidate === "function") {
    const candidateFn = candidate as (...args: unknown[]) => ReactNode;
    return (context: GuideSeoTemplateContext) => {
      try {
        if (candidateFn.length > 0) {
          return candidateFn(context);
        }
        return createElement(candidateFn as () => ReactNode);
      } catch {
        return null;
      }
    };
  }

  if (candidate !== undefined) {
    const value = candidate as ReactNode;
    return () => value;
  }

  return null;
}

function pickExport(module: Record<string, unknown>, exportName?: string) {
  if (exportName && exportName in module) return module[exportName];
  if ("default" in module && module.default !== undefined) return module.default;
  if ("createJsonLd" in module) return module.createJsonLd;
  if ("buildJsonLd" in module) return module.buildJsonLd;
  if ("renderJsonLd" in module) return module.renderJsonLd;
  return undefined;
}
