import type { RouteContent } from "@/lib/how-to-get-here/schema";

export type RouteContentModule = { default: RouteContent };

export const loadSplitRouteModule = async (
  lang: string,
  contentKey: string,
): Promise<RouteContentModule | undefined> => {
  try {
    // i18n-exempt -- TECH-000 [ttl=2026-12-31] dynamic import path for split locale content JSON modules
    return await import(`../../locales/${lang}/how-to-get-here/routes/${contentKey}.json`);
  } catch {
    return undefined;
  }
};
