import type { LinkDescriptor, MetaDescriptor } from "react-router";
import type { RouteConfigEntry } from "@react-router/dev/routes";

import { BASE_URL } from "@/config/site";
import roomsData from "@/data/roomsData";
import { TAGS_SUMMARY } from "@/data/tags.index";
import { i18nConfig } from "@/i18n.config";
import routes from "@/routes";

import type { RouteModule } from "./route-module-types";
import { routeModules } from "./route-modules";
import {
  isRedirectResult,
  type LoaderFunctionArgs,
  type Location,
  locationFromUrl,
  type RouterState,
} from "./router-state";

type RouteMatch = {
  id: string;
  file: string;
  path: string;
};

export type ResolvedMatch = RouteMatch & {
  data?: unknown;
  handle?: unknown;
};

export type ResolvedRoute = {
  matches: ResolvedMatch[];
  params: Record<string, string | undefined>;
  location: Location;
  head: {
    meta: MetaDescriptor[];
    links: LinkDescriptor[];
  };
};

type MatchResult = {
  matches: RouteMatch[];
  params: Record<string, string | undefined>;
};

const SUPPORTED_LANGS = new Set(
  (i18nConfig.supportedLngs as readonly string[] | undefined) ?? [],
);

const PARAM_VALUES: Record<string, string[]> = {
  id: roomsData.map((room) => room.id),
  tag: TAGS_SUMMARY.map((summary) => summary.tag),
};

const isResponse = (value: unknown): value is Response =>
  Boolean(
    value &&
      typeof value === "object" &&
      "status" in value &&
      "headers" in value &&
      typeof (value as { status?: unknown }).status === "number" &&
      typeof (value as { headers?: { get?: unknown } }).headers?.get === "function",
  );

const sanitizeForNext = (value: unknown): unknown => {
  if (value === undefined) return null;

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForNext(entry));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) {
      if (entry === undefined) continue;
      next[key] = sanitizeForNext(entry);
    }
    return next;
  }

  return value;
};

const resolveResponseResult = (
  response: Response,
):
  | { redirect: { destination: string; permanent: boolean } }
  | { notFound: true }
  | null => {
  if (response.status === 404) {
    return { notFound: true };
  }

  if (response.status >= 300 && response.status < 400) {
    const destination = response.headers.get("Location") ?? response.headers.get("location");
    if (destination) {
      return {
        redirect: {
          destination,
          permanent: response.status === 301 || response.status === 308,
        },
      };
    }
  }

  return null;
};

const normalizePathname = (value: string): string => {
  if (!value) return "/";
  const trimmed = value.split("?")[0]?.split("#")[0] ?? "/";
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const splitSegments = (value: string): string[] =>
  value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const matchPathSegments = (
  patternSegments: string[],
  segments: string[],
  params: Record<string, string | undefined>,
): { params: Record<string, string | undefined>; remaining: string[] } | null => {
  if (patternSegments.length === 0) {
    return { params, remaining: segments };
  }

  const nextParams = { ...params };

  for (let i = 0; i < patternSegments.length; i += 1) {
    const pattern = patternSegments[i];
    const value = segments[i];
    if (!pattern) return null;

    if (pattern === "*") {
      return { params: nextParams, remaining: [] };
    }

    if (value === undefined) return null;

    if (pattern.startsWith(":")) {
      const key = pattern.slice(1);
      nextParams[key] = decodeSegment(value);
      continue;
    }

    if (pattern !== value) return null;
  }

  return { params: nextParams, remaining: segments.slice(patternSegments.length) };
};

const resolveRouteId = (entry: RouteConfigEntry, fallback: string): string =>
  entry.id ?? entry.file ?? entry.path ?? fallback;

const matchRoutes = (
  entries: RouteConfigEntry[],
  segments: string[],
  parentSegments: string[] = [],
  params: Record<string, string | undefined> = {},
): MatchResult | null => {
  for (const entry of entries) {
    const entrySegments = entry.index
      ? []
      : entry.path
        ? splitSegments(entry.path)
        : [];
    const match = matchPathSegments(entrySegments, segments, params);
    if (!match) continue;

    const fullSegments = [...parentSegments, ...entrySegments];
    const fullPath = fullSegments.length ? `/${fullSegments.join("/")}` : "/";
    const nextParams = match.params;

    if (entry.children && entry.children.length > 0) {
      const childMatch = matchRoutes(
        entry.children,
        match.remaining,
        fullSegments,
        nextParams,
      );
      if (childMatch) {
        const current = entry.file
          ? [{ id: resolveRouteId(entry, fullPath), file: entry.file, path: fullPath }]
          : [];
        return { matches: [...current, ...childMatch.matches], params: childMatch.params };
      }
    }

    if (match.remaining.length === 0 || entrySegments.includes("*")) {
      if (!entry.file) continue;
      return {
        matches: [{ id: resolveRouteId(entry, fullPath), file: entry.file, path: fullPath }],
        params: nextParams,
      };
    }
  }

  return null;
};

const collectRoutePatterns = (
  entries: RouteConfigEntry[],
  parentSegments: string[] = [],
): string[] => {
  const patterns: string[] = [];
  for (const entry of entries) {
    const entrySegments = entry.index
      ? []
      : entry.path
        ? splitSegments(entry.path)
        : [];
    const fullSegments = [...parentSegments, ...entrySegments];
    const fullPath = fullSegments.length ? `/${fullSegments.join("/")}` : "/";

    if (entry.file) {
      patterns.push(fullPath);
    }

    if (entry.children && entry.children.length > 0) {
      patterns.push(...collectRoutePatterns(entry.children, fullSegments));
    }
  }

  return patterns;
};

const expandDynamicPath = (path: string): string[] => {
  const normalized = normalizePathname(path);
  const segments = splitSegments(normalized);
  if (segments.some((segment) => segment === "*")) {
    return [];
  }

  let paths = [""];
  for (const segment of segments) {
    if (segment.startsWith(":")) {
      const key = segment.slice(1);
      const values = PARAM_VALUES[key];
      if (!values || values.length === 0) {
        return [];
      }
      paths = paths.flatMap((prefix) =>
        values.map((value) => `${prefix}/${encodeURIComponent(value)}`),
      );
      continue;
    }
    paths = paths.map((prefix) => `${prefix}/${segment}`);
  }

  return paths.map((value) => normalizePathname(value));
};

const listAllPaths = (): string[] => {
  const patterns = collectRoutePatterns(routes as RouteConfigEntry[]);
  const expanded = patterns.flatMap((pattern) => expandDynamicPath(pattern));
  return Array.from(new Set(expanded)).sort();
};

export const listLocalizedPaths = (): string[] =>
  listAllPaths().filter((path) => {
    const [lang] = splitSegments(path);
    return lang ? SUPPORTED_LANGS.has(lang) : false;
  });

export const listDirectionPaths = (): string[] =>
  listAllPaths().filter((path) => path.startsWith("/directions/"));

const buildHead = (
  module: RouteModule,
  data: unknown,
  params: Record<string, string | undefined>,
  location: Location,
  matches: ResolvedMatch[],
  request: Request,
): { meta: MetaDescriptor[]; links: LinkDescriptor[] } => {
  const metaArgs = { data, params, location, matches, request };
  const meta = module.meta ? module.meta(metaArgs) ?? [] : [];
  const links = module.links ? module.links(metaArgs) ?? [] : [];
  return {
    meta: (Array.isArray(meta) ? meta : []).filter((entry): entry is MetaDescriptor => entry != null).map(
      (entry) => sanitizeForNext(entry) as MetaDescriptor,
    ),
    links: (Array.isArray(links) ? links : []).filter((entry): entry is LinkDescriptor => entry != null).map(
      (entry) => sanitizeForNext(entry) as LinkDescriptor,
    ),
  };
};

export const resolveRoute = async (
  pathname: string,
): Promise<
  | { result: ResolvedRoute }
  | { redirect: { destination: string; permanent: boolean } }
  | { notFound: true }
> => {
  const normalized = normalizePathname(pathname);
  const segments = splitSegments(normalized);
  const matchResult = matchRoutes(routes as RouteConfigEntry[], segments);
  if (!matchResult) {
    return { notFound: true };
  }

  const [maybeLang] = segments;
  if (maybeLang && SUPPORTED_LANGS.has(maybeLang) && !matchResult.params["lang"]) {
    matchResult.params["lang"] = maybeLang;
  }

  const origin = BASE_URL || "http://localhost";
  const url = new URL(normalized, origin);
  const request = new Request(url.toString());
  const params = Object.fromEntries(
    Object.entries(matchResult.params).filter(([, value]) => value !== undefined),
  ) as Record<string, string | undefined>;
  const location = locationFromUrl(url.toString());

  const resolved: ResolvedMatch[] = [];
  let leafModule: RouteModule | undefined;
  let leafData: unknown;

  for (const match of matchResult.matches) {
    const loader = routeModules[match.file];
    if (!loader) {
      throw new Error(`Missing route module for ${match.file}`);
    }
    const routeModule = (await loader()) as RouteModule;
    const loadFn = routeModule.clientLoader ?? routeModule.loader;
    let data: unknown;
    if (loadFn) {
      try {
        const args: LoaderFunctionArgs = { request, params };
        const result = await loadFn(args);
        if (isRedirectResult(result)) {
          return {
            redirect: {
              destination: result.location,
              permanent: result.status === 301,
            },
          };
        }
        if (isResponse(result)) {
          const resolvedResponse = resolveResponseResult(result);
          if (resolvedResponse) {
            return resolvedResponse;
          }
          throw new Error(`Unhandled route loader Response with status ${result.status}`);
        }
        data = result === undefined ? undefined : sanitizeForNext(result);
      } catch (error) {
        if (isRedirectResult(error)) {
          return {
            redirect: {
              destination: error.location,
              permanent: error.status === 301,
            },
          };
        }
        if (isResponse(error)) {
          const resolvedResponse = resolveResponseResult(error);
          if (resolvedResponse) {
            return resolvedResponse;
          }
          throw new Error(`Unhandled route loader Response with status ${error.status}`);
        }
        throw error;
      }
    }

    const sanitizedHandle = routeModule.handle === undefined ? undefined : sanitizeForNext(routeModule.handle);

    resolved.push({
      ...match,
      ...(data !== undefined ? { data } : {}),
      ...(sanitizedHandle !== undefined ? { handle: sanitizedHandle } : {}),
    });

    leafModule = routeModule;
    leafData = data;
  }

  if (!leafModule) {
    return { notFound: true };
  }

  const head = buildHead(leafModule, leafData, params, location, resolved, request);

  return {
    result: {
      matches: resolved,
      params,
      location,
      head,
    },
  };
};

export const buildRouterState = (resolved: ResolvedRoute): RouterState => {
  const matches = resolved.matches.map((match) => ({
    route: {
      id: match.id,
      ...(match.handle !== undefined ? { handle: match.handle } : {}),
    },
    ...(match.data !== undefined ? { data: match.data } : {}),
  }));

  const loaderData = matches.reduce<Record<string, unknown>>((acc, match) => {
    if (match.route.id && match.data !== undefined) {
      acc[match.route.id] = match.data;
    }
    return acc;
  }, {});

  return {
    location: resolved.location,
    params: resolved.params,
    matches,
    loaderData,
  };
};
