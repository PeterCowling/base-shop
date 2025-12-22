import definitions from "../../data/how-to-get-here/routes.json";
import {
  howToGetHereRouteDefinitionsSchema,
  type GalleryBinding,
  type LinkBinding,
  type LinkListBinding,
  type LinkTarget,
  type MediaBinding,
  type RouteDefinitionDocument,
  type RouteDefinitionEntry,
} from "./schema";
import { IS_PROD } from "@/config/env";

export type RouteDefinition = Omit<
  RouteDefinitionEntry,
  "linkBindings" | "media" | "galleries" | "linkLists"
> & {
  slug: string;
  linkBindings: LinkBinding[];
  media: MediaBinding[];
  galleries: GalleryBinding[];
  linkLists: LinkListBinding[];
  status?: "draft" | "review" | "published";
};

const raw: RouteDefinitionDocument = howToGetHereRouteDefinitionsSchema.parse(definitions);

const ROUTE_DEFINITIONS: RouteDefinition[] = Object.entries(raw.routes).map(([slug, value]) => ({
  slug,
  contentKey: value.contentKey,
  linkBindings: value.linkBindings ?? [],
  media: value.media ?? [],
  galleries: value.galleries ?? [],
  linkLists: value.linkLists ?? [],
  sectionsRoot: value.sectionsRoot ?? undefined,
  sectionPaths: value.sectionPaths ?? undefined,
  status: value.status ?? "published",
}));

export function listHowToSlugs(): string[] {
  // In production, hide draft/review routes. In dev, include everything.
  const isProd = IS_PROD;
  return ROUTE_DEFINITIONS
    .filter((route) => !isProd || (route.status ?? "published") === "published")
    .map((route) => route.slug);
}

export function getRouteDefinition(slug: string): RouteDefinition | undefined {
  return ROUTE_DEFINITIONS.find((route) => route.slug === slug);
}

function bindingKeyMatches(pattern: string, key: string): boolean {
  if (pattern === key) {
    return true;
  }

  if (pattern.endsWith(".*")) {
    const base = pattern.slice(0, -2);
    if (base.length === 0) {
      return true;
    }
    if (key === base) {
      return true;
    }
    const prefix = base.endsWith(".") ? base : `${base}.`;
    return key.startsWith(prefix);
  }

  if (!pattern.includes("*")) {
    return false;
  }

  const patternSegments = pattern.split(".");
  const keySegments = key.split(".");
  if (patternSegments.length !== keySegments.length) {
    return false;
  }

  for (let index = 0; index < patternSegments.length; index += 1) {
    const segment = patternSegments[index];
    if (segment === "*") {
      continue;
    }
    if (segment !== keySegments[index]) {
      return false;
    }
  }

  return true;
}

export function findPlaceholderBinding(route: RouteDefinition, key: string): LinkBinding | undefined {
  const direct = route.linkBindings.find((binding) => binding.key === key);
  if (direct) {
    return direct;
  }

  for (const binding of route.linkBindings) {
    if (binding.key === key) {
      continue;
    }
    if (bindingKeyMatches(binding.key, key)) {
      return binding;
    }
  }

  return undefined;
}

export type { LinkBinding, LinkListBinding, LinkTarget };
