import type { GuideArea, GuideManifestEntryInput, GuideStatus } from "../../../src/routes/guides/guide-manifest";
import type { GuideKey } from "../../../src/routes.guides-helpers";

import { buildDefaultChecklist, toPascalCase } from "../lib/utils";

export type GuideMigrationPattern = "generic" | "manual" | "redirect";

export const GUIDE_MIGRATION_PATTERNS: GuideMigrationPattern[] = ["generic", "manual", "redirect"];

const DEFAULT_GUIDE_OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto" as const,
  },
} as const;

export function normalizeGuideMigrationPattern(pattern?: string): GuideMigrationPattern {
  if (pattern) {
    const lowered = pattern.toLowerCase() as GuideMigrationPattern;
    if (GUIDE_MIGRATION_PATTERNS.includes(lowered)) {
      return lowered;
    }
  }
  return "generic";
}

type RouteSourceParams = {
  pattern: GuideMigrationPattern;
  key: GuideKey;
  slug: string;
};

export function buildGuideMigrationRouteSource({ pattern, key, slug }: RouteSourceParams): string {
  const commentPath = ["src", "routes", "guides", `${slug}.tsx`].join("/");

  if (pattern === "manual") {
    const lines: string[] = [];
    lines.push(`// ${commentPath}`);
    lines.push('import { defineGuideRoute } from "./defineGuideRoute";');
    lines.push('import { getGuideManifestEntry } from "./guide-manifest";');
    lines.push('import type { GuideSeoTemplateContext } from "./guide-seo/types";');
    lines.push('import type { GuideKey } from "@/routes.guides-helpers";');
    lines.push("");
    lines.push(`export const GUIDE_KEY = ${JSON.stringify(key)} as const satisfies GuideKey;`);
    lines.push(`export const GUIDE_SLUG = ${JSON.stringify(slug)} as const;`);
    lines.push("");
    lines.push("const manifestEntry = getGuideManifestEntry(GUIDE_KEY);");
    lines.push(`if (!manifestEntry) throw new Error("guide manifest entry missing for ${key}");`);
    lines.push("");
    lines.push("const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {");
    lines.push("  template: () => ({");
    lines.push("    renderGenericContent: false,");
    lines.push("    suppressTocTitle: true,");
    lines.push("    suppressUnlocalizedFallback: true,");
    lines.push("    preferManualWhenUnlocalized: true,");
    lines.push("    articleLead: (_context: GuideSeoTemplateContext) => {");
    lines.push(`      // TODO: Replace with manual article lead content (intro/sections) for ${key}.`);
    lines.push("      return null;");
    lines.push("    },");
    lines.push("    articleExtras: (_context: GuideSeoTemplateContext) => {");
    lines.push("      // TODO: Add optional extras (galleries, callouts, etc.) or return null.");
    lines.push("      return null;");
    lines.push("    },");
    lines.push("  }),");
    lines.push("});");
    lines.push("");
    lines.push("export default Component;");
    lines.push("export { clientLoader, meta, links };");
    return `${lines.join("\n")}\n`;
  }

  if (pattern === "redirect") {
    const componentName = toPascalCase(slug);
    const lines: string[] = [];
    lines.push(`// ${commentPath}`);
    lines.push('import { redirect, type LoaderFunctionArgs } from "react-router";');
    lines.push('import type { MetaFunction, LinksFunction } from "react-router";');
    lines.push('import type { GuideKey } from "@/routes.guides-helpers";');
    lines.push('import { getSlug } from "@/utils/slug";');
    lines.push('import { BASE_URL } from "@/config/site";');
    lines.push('import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";');
    lines.push('import { langFromRequest } from "@/utils/lang";');
    lines.push('import buildCfImageUrl from "@/lib/buildCfImageUrl";');
    lines.push('import { i18nConfig, type AppLanguage } from "@/i18n.config";');
    lines.push("");
    lines.push(`export const GUIDE_KEY = ${JSON.stringify(key)} as const satisfies GuideKey;`);
    lines.push(`export const GUIDE_SLUG = ${JSON.stringify(slug)} as const;`);
    lines.push("");
    lines.push("function resolveTarget(lang: AppLanguage): string {");
    lines.push('  const areaSlug = getSlug("experiences", lang);');
    lines.push("  // TODO: Update target path if this guide should redirect elsewhere.");
    lines.push('  return "/" + lang + "/" + areaSlug + "/" + GUIDE_SLUG;');
    lines.push("}");
    lines.push("");
    lines.push("export async function clientLoader({ request }: LoaderFunctionArgs) {");
    lines.push("  const lang = (langFromRequest(request) ?? (i18nConfig.fallbackLng as AppLanguage)) as AppLanguage;");
    lines.push("  throw redirect(resolveTarget(lang));");
    lines.push("}");
    lines.push("");
    lines.push("export const meta: MetaFunction = ({ data }) => {");
    lines.push("  const payload = (data ?? {}) as { lang?: AppLanguage };");
    lines.push("  const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);");
    lines.push("  const target = resolveTarget(lang);");
    lines.push("  const image = buildCfImageUrl(" + JSON.stringify(DEFAULT_GUIDE_OG_IMAGE.path) + ", {");
    lines.push(`    width: ${DEFAULT_GUIDE_OG_IMAGE.width},`);
    lines.push(`    height: ${DEFAULT_GUIDE_OG_IMAGE.height},`);
    lines.push(`    quality: ${DEFAULT_GUIDE_OG_IMAGE.transform.quality},`);
    lines.push(`    format: ${JSON.stringify(DEFAULT_GUIDE_OG_IMAGE.transform.format)},`);
    lines.push("  });");
    lines.push("  return buildRouteMeta({");
    lines.push("    lang,");
    lines.push(`    title: "guides.meta.${key}.title",`);
    lines.push(`    description: "guides.meta.${key}.description",`);
    lines.push("    url: BASE_URL + target,");
    lines.push("    path: target,");
    lines.push(
      `    image: { src: image, width: ${DEFAULT_GUIDE_OG_IMAGE.width}, height: ${DEFAULT_GUIDE_OG_IMAGE.height} },`,
    );
    lines.push('    ogType: "article",');
    lines.push("    includeTwitterUrl: true,");
    lines.push("  });");
    lines.push("};");
    lines.push("");
    lines.push("export const links: LinksFunction = () => buildRouteLinks();");
    lines.push("");
    lines.push(`export default function ${componentName}Redirect(): null {`);
    lines.push("  return null;");
    lines.push("}");
    return `${lines.join("\n")}\n`;
  }

  const lines: string[] = [];
  lines.push(`// ${commentPath}`);
  lines.push('import { defineGuideRoute } from "./defineGuideRoute";');
  lines.push('import { getGuideManifestEntry } from "./guide-manifest";');
  lines.push('import type { GuideKey } from "@/routes.guides-helpers";');
  lines.push("");
  lines.push(`export const GUIDE_KEY = ${JSON.stringify(key)} as const satisfies GuideKey;`);
  lines.push(`export const GUIDE_SLUG = ${JSON.stringify(slug)} as const;`);
  lines.push("");
  lines.push("const manifestEntry = getGuideManifestEntry(GUIDE_KEY);");
  lines.push(`if (!manifestEntry) throw new Error("guide manifest entry missing for ${key}");`);
  lines.push("");
  lines.push("const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry);");
  lines.push("");
  lines.push("export default Component;");
  lines.push("export { clientLoader, meta, links };");
  return `${lines.join("\n")}\n`;
}

type ManifestParams = {
  key: GuideKey;
  slug: string;
  area: GuideArea;
  status: GuideStatus;
  pattern: GuideMigrationPattern;
  related: string[];
  structured?: GuideManifestEntryInput["structuredData"];
};

export function buildGuideMigrationManifestEntry({
  key,
  slug,
  area,
  status,
  pattern,
  related,
  structured,
}: ManifestParams): GuideManifestEntryInput {
  const structuredData: GuideManifestEntryInput["structuredData"] =
    structured && structured.length > 0 ? structured : pattern === "redirect" ? [] : ["Article"];

  const blocks: GuideManifestEntryInput["blocks"] = [];
  if (pattern === "generic") {
    blocks.push(
      { type: "genericContent", options: { contentKey: key, showToc: true } },
      { type: "faq", options: { fallbackKey: key, alwaysProvideFallback: true } },
    );
  }

  const options: NonNullable<GuideManifestEntryInput["options"]> = {};
  if (pattern !== "redirect") {
    options.showPlanChoice = true;
    options.showTagChips = true;
  }
  if (pattern === "manual") {
    options.suppressTocTitle = true;
    options.suppressUnlocalizedFallback = true;
    options.preferManualWhenUnlocalized = true;
  }

  return {
    key,
    slug,
    contentKey: key,
    status,
    draftPathSegment: `guides/${slug}`,
    areas: [area],
    primaryArea: area,
    structuredData,
    relatedGuides: related,
    blocks,
    options,
    checklist: buildDefaultChecklist(),
  };
}