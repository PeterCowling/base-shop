/**
 * Module resolution utilities for block composition.
 *
 * Handles webpack context resolution for JSON-LD and gallery modules.
 */
import type { ReactNode } from "react";
import { createElement } from "react";

import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "@/utils/webpackGlob";

import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import { normalizeModuleKey, normalizeModuleSpecifier } from "./stringHelpers";

// Test fixture stubs (actual files not present in this build)
const TestJsonLdWidgetFixture = { default: {} };

export const JSON_LD_CONTEXT = supportsWebpackGlob
  ? getWebpackContext(
      "..",
      true,
      /(?:\.jsonld|\.schema|JsonLd|JsonLD|StructuredData|MetaBridge|Meta)\.tsx?$/,
    )
  : undefined;

const TEST_JSON_LD_MODULES: Record<string, unknown> =
  process.env.NODE_ENV === "test"
    ? {
        "__tests__/fixtures/TestJsonLdWidget.jsonld": TestJsonLdWidgetFixture,
        "fixtures/TestJsonLdWidget.jsonld": TestJsonLdWidgetFixture,
      }
    : {};

export const JSON_LD_MODULES: Record<string, unknown> = {
  ...webpackContextToRecord<Record<string, unknown>>(JSON_LD_CONTEXT),
  ...TEST_JSON_LD_MODULES,
};

export const GALLERY_CONTEXT = supportsWebpackGlob
  ? getWebpackContext("..", true, /\.gallery\.tsx?$/)
  : undefined;

export const GALLERY_MODULES: Record<string, unknown> =
  webpackContextToRecord<Record<string, unknown>>(GALLERY_CONTEXT);

type HeadRenderer = (context: GuideSeoTemplateContext) => ReactNode;
type ComponentType = React.ComponentType<Record<string, never>>;

/**
 * Pick the appropriate export from a module.
 */
export function pickExport(module: Record<string, unknown>, exportName?: string) {
  if (exportName && exportName in module) return module[exportName];
  if ("default" in module && module["default"] !== undefined) return module["default"];
  if ("createJsonLd" in module) return module["createJsonLd"];
  if ("buildJsonLd" in module) return module["buildJsonLd"];
  if ("renderJsonLd" in module) return module["renderJsonLd"];
  return undefined;
}

/**
 * Resolve a head renderer from a module path.
 */
export function resolveHeadRenderer(modulePath: string, exportName?: string): HeadRenderer | null {
  if (!modulePath) return null;
  const target = normalizeModuleSpecifier(modulePath);
  let matchedModule: Record<string, unknown> | undefined;

  for (const [key, mod] of Object.entries(JSON_LD_MODULES)) {
    if (normalizeModuleKey(key) === target) {
      matchedModule = mod as Record<string, unknown>;
      break;
    }
  }

  if (!matchedModule) {
    return null;
  }

  const candidate = pickExport(matchedModule, exportName);
  if (typeof candidate === "function") {
    const Fn = candidate as ((context: GuideSeoTemplateContext) => ReactNode) | ComponentType;
    return (context: GuideSeoTemplateContext) => {
      try {
        if (Fn.length > 0) {
          return (Fn as (context: GuideSeoTemplateContext) => ReactNode)(context);
        }
        return createElement(Fn as ComponentType, null);
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
