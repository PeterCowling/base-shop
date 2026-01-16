import type { RouteContent } from "@/lib/how-to-get-here/schema";
import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "@/utils/webpackGlob";

export type RouteContentModule = { default: RouteContent };

type SplitRouteModuleLoader = () => Promise<RouteContentModule>;

const normalizeRouteModulePath = (rawPath: string): string =>
  rawPath.replace(/^(\.\.\/)+/, "/").replace(/^\.\//, "/");

const supportsImportMetaGlob = typeof import.meta.glob === "function";

const webpackSplitRouteModules: Record<string, RouteContentModule> = supportsWebpackGlob
  ? webpackContextToRecord<RouteContentModule>(
      getWebpackContext("../../locales", true, /how-to-get-here\/routes\/[^/]+\\.json$/),
      { prefix: "/locales" },
    )
  : {};

const fallbackSplitRouteModules: Record<string, SplitRouteModuleLoader> = Object.fromEntries(
  Object.entries(webpackSplitRouteModules).map(([path, mod]) => [path, () => Promise.resolve(mod)]),
) as Record<string, SplitRouteModuleLoader>;

const importMetaSplitRouteModules: Record<string, SplitRouteModuleLoader> = supportsImportMetaGlob
  ? import.meta.glob<RouteContentModule>(
      "../../locales/*/how-to-get-here/routes/*.json",
    )
  : {};

const rawSplitRouteModules: Record<string, SplitRouteModuleLoader> = {
  ...fallbackSplitRouteModules,
  ...importMetaSplitRouteModules,
};

export const splitRouteModules: Record<string, SplitRouteModuleLoader> = Object.fromEntries(
  Object.entries(rawSplitRouteModules).map(([path, loader]) => [normalizeRouteModulePath(path), loader]),
) as Record<string, SplitRouteModuleLoader>;

export const loadSplitRouteModule = async (
  lang: string,
  contentKey: string,
): Promise<RouteContentModule | undefined> => {
  const normalizedPath = `/locales/${lang}/how-to-get-here/routes/${contentKey}.json`;
  const loader = splitRouteModules[normalizedPath];
  if (!loader) return undefined;
  return loader();
};
