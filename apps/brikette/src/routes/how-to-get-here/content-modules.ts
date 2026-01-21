import type { RouteContent } from "@/lib/how-to-get-here/schema";

export type RouteContentModule = { default: RouteContent };

export const loadSplitRouteModule = async (
  lang: string,
  contentKey: string,
): Promise<RouteContentModule | undefined> => {
  try {
    const mod = await import(
      /* webpackInclude: /how-to-get-here\/routes\/[^/]+\.json$/ */
      `../../locales/${lang}/how-to-get-here/routes/${contentKey}.json`
    );
    return mod as RouteContentModule;
  } catch {
    return undefined;
  }
};
