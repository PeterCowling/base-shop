import { describe, expect, it } from "vitest";
import { matchRoutes } from "react-router-dom";

import routesPromise from "../../routes";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";

describe("guides aliases", () => {
  it("matches an alias route like /en/guides/positano-beaches", async () => {
    const lang = "en";
    const guidesSlug = getSlug("guides", lang);
    const routes = await routesPromise;
    const aliasPathSegment = `${guidesSlug}/${guideSlug(lang as any, "positanoBeaches" as any)}`;
    const guidesRoute = (function findGuides(nodes: typeof routes): any {
      for (const node of nodes) {
        if (node.id === `${lang}-guides-root`) {
          return node;
        }
        if (node.children) {
          const match = findGuides(node.children);
          if (match) return match;
        }
      }
      return undefined;
    })(routes);
    expect(guidesRoute?.children?.some((child: any) => child.id === `${lang}-guides-alias-positanoBeaches`)).toBe(
      true,
    );
    const aliasPath = `/${lang}/${guidesSlug}/${guideSlug(lang as any, "positanoBeaches" as any)}`;
    const matches = matchRoutes(routes, aliasPath);
    expect(matches?.map((m) => m.route.id)).toContain(`${lang}-guides-alias-positanoBeaches`);
  });
});