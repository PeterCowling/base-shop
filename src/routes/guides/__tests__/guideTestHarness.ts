// src/routes/guides/__tests__/guideTestHarness.ts
import { screen, waitFor } from "@testing-library/react";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAreaToSlugKey, getGuideManifestEntry } from "../guide-manifest";
import { getSlug } from "@/utils/slug";
import { guideSlug, guideHref } from "@/routes.guides-helpers";

type RenderOptions = {
  route?: string;
  lang?: string;
};

type GuideTestContext = {
  guideKey: GuideKey;
  routeModule: Awaited<ReturnType<typeof importRouteModule>>;
  manifestEntry: NonNullable<ReturnType<typeof getGuideManifestEntry>>;
  renderRoute: (options?: RenderOptions) => Promise<ReturnType<typeof importRenderers>["renderRoute"]>;
  screen: typeof screen;
  waitFor: typeof waitFor;
  setTranslations: Awaited<ReturnType<typeof importTestUtils>>["setTranslations"];
  setCurrentLanguage: Awaited<ReturnType<typeof importTestUtils>>["setCurrentLanguage"];
  resetMocks: Awaited<ReturnType<typeof importTestUtils>>["resetGuideTestState"];
};

async function importTestUtils() {
  const mod = await import("./guides.test-utils.tsx");
  return {
    resetGuideTestState: mod.resetGuideTestState,
    setTranslations: mod.setTranslations,
    setCurrentLanguage: mod.setCurrentLanguage,
    hasGuideTranslation: mod.hasGuideTranslation,
    setActiveGuideKey: mod.setActiveGuideKey,
  };
}

async function importRenderers() {
  const mod = await import("@tests/renderers");
  return {
    renderRoute: mod.renderRoute,
  };
}

function normaliseOverridePath(override: string): string {
  if (override.startsWith("routes/guides/")) {
    return `../${override.slice("routes/guides/".length)}`;
  }
  if (override.startsWith("routes/")) {
    return `../../${override.slice("routes/".length)}`;
  }
  if (override.startsWith("./") || override.startsWith("../")) {
    return override;
  }
  return `../${override}`;
}

function resolveRouteLoader(entry: GuideManifestEntry) {
  const candidates: string[] = [];
  const overridePath = GUIDE_COMPONENT_OVERRIDES[entry.key];
  if (overridePath) {
    candidates.push(normaliseOverridePath(overridePath));
  }
  candidates.push(`../${entry.slug}.tsx`);
  candidates.push(`../${entry.slug}/index.tsx`);

  for (const candidate of candidates) {
    const loader = ROUTE_MODULE_LOADERS[candidate];
    if (loader) {
      return loader;
    }
  }

  const fallback = Object.entries(ROUTE_MODULE_LOADERS).find(([path]) =>
    path.endsWith(`/${entry.slug}.tsx`),
  );

  return fallback ? fallback[1] : undefined;
}

function buildRoutePath(
  manifestEntry: NonNullable<ReturnType<typeof getGuideManifestEntry>>,
  lang: AppLanguage,
): string {
  const areaKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const areaSlug = getSlug(areaKey, lang);
  const guide = guideSlug(lang, manifestEntry.key);
  return `/${lang}/${areaSlug}/${guide}`;
}

export async function withGuideMocks(
  guideKey: GuideKey,
  fn: (context: GuideTestContext) => Promise<void> | void,
) {
  const utils = await importTestUtils();
  utils.resetGuideTestState();

  const manifestEntry = getGuideManifestEntry(guideKey);
  if (!manifestEntry) {
    throw new Error(`Guide manifest entry missing for ${guideKey}`);
  }



  const { renderRoute } = await importRenderers();
  const loader = resolveRouteLoader(manifestEntry);
  if (!loader) {
    throw new Error(`Unable to locate route module for guide ${manifestEntry.key} (${manifestEntry.slug})`);
  }

  const routeModule = (await loader()) as Record<string, unknown>;

  const renderGuideRoute = async (options?: RenderOptions) => {
    const lang = options?.lang ?? "en";
    const route = options?.route ?? buildRoutePath(manifestEntry, lang);

    let loaderData: unknown;
    if (typeof routeModule.clientLoader === "function") {
      const request = new Request(`https://example.test${route}`);
      loaderData = await routeModule.clientLoader({ params: { lang }, request } as any);
    }

    const result = renderRoute(routeModule, {
      route,
      loaderData,
      head: {
        data: loaderData,
      },
    });

    await waitFor(() => {
      expect(screen.queryByRole("article")).not.toBeNull();
    });

    // eslint-disable-next-line no-console
    console.log("renderGuideRoute result", manifestEntry.key, typeof result);
    if (!result) {
      throw new Error(`renderRoute returned ${String(result)} for ${manifestEntry.key}`);
    }
    return result;
  };

  await fn({
    guideKey,
    manifestEntry,
    routeModule,
    renderRoute: renderGuideRoute as any,
    screen,
    waitFor,
    setTranslations: utils.setTranslations,
    setCurrentLanguage: utils.setCurrentLanguage,
    resetMocks: utils.resetGuideTestState,
  });
}

const SUPPORTED_LANGUAGE_SET = new Set<string>(i18nConfig.supportedLngs);

function normaliseRoutePath(route: string): string {
  if (route.startsWith("http://") || route.startsWith("https://")) {
    try {
      return new URL(route).pathname || "/";
    } catch {
      return "/";
    }
  }
  return route.startsWith("/") ? route : `/${route}`;
}

function inferLanguageFromRoute(route: string): AppLanguage | undefined {
  const pathname = normaliseRoutePath(route);
  const firstSegment = pathname.replace(/^\/+/, "").split("/")[0]?.toLowerCase();
  if (!firstSegment) return undefined;
  return SUPPORTED_LANGUAGE_SET.has(firstSegment) ? (firstSegment as AppLanguage) : undefined;
}
type RenderOptions = {
  route?: string;
  lang?: AppLanguage;
  harness?: HarnessOptions;
};
