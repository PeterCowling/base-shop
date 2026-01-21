// src/routes/guides/layout.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction,MetaFunction } from "react-router";
import {
  Link,
  type LoaderFunctionArgs,
  Outlet,
  useLoaderData,
  useNavigate,
} from "react-router-dom";

import PlanChoiceAnalytics from "@/components/guides/PlanChoiceAnalytics";
import { IS_PROD, PREVIEW_TOKEN } from "@/config/env";
import { BASE_URL } from "@/config/site";
import * as GuidesIndex from "@/data/guides.index";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { GUIDE_KEYS, type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

// Container primitive wrapper to satisfy DS container-width guardrails
type ContainerProps = JSX.IntrinsicElements["div"];

function Container({ children, ...rest }: ContainerProps): JSX.Element {
  return <div {...rest}>{children}</div>;
}

function GuidesLayout(): JSX.Element {
  const { lang } = useLoaderData<Awaited<ReturnType<typeof clientLoader>>>();
  const navigate = useNavigate();
  const { t } = useTranslation("guides");
  const fallbackGuides = useMemo(() => i18n.getFixedT("en", "guides"), []);
  const backLabel = t("labels.backLink", {
    defaultValue: fallbackGuides("labels.backLink", { defaultValue: "Back" }) as string,
  }) as string;
  const guidesListingPath = `/${lang}/${getSlug("guides", lang)}`;

  const handleBackClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      event.preventDefault();
      navigate(-1);
    }
  };

  return (
    <Container className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:max-w-4xl lg:px-8">
      <Link
        to={guidesListingPath}
        onClick={handleBackClick}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary-700 underline decoration-primary-200 underline-offset-4 transition hover:text-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <span aria-hidden="true">←</span>
        {backLabel}
      </Link>
      <PlanChoiceAnalytics />
      <Outlet />
    </Container>
  );
}

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as AppLanguage;
  // Publication guard: 404 non-published guides in production unless preview token present
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    // Expected: /{lang}/guides/{slug}
    if (segments.length >= 3 && segments[1] === getSlug("guides", lang)) {
      const slug = segments[2];
      if (slug && slug !== getSlug("guidesTags", lang)) {
        const key = (GUIDE_KEYS as readonly GuideKey[]).find((k) => guideSlug(lang, k) === slug);
        if (key) {
          const STATUS_MAP = (GuidesIndex as unknown as Record<string, unknown>)[
            "GUIDE_STATUS_BY_KEY"
          ] as Readonly<Record<GuideKey, "draft" | "review" | "published">> | undefined;
          const status = STATUS_MAP?.[key] ?? "published";
          const token = PREVIEW_TOKEN ?? "";
          const previewParam = url.searchParams.get("preview");
          const isPreviewAllowed = token && previewParam === token;
          const isProd = IS_PROD;
          if (isProd && status !== "published" && !isPreviewAllowed) {
            throw new Response("Not Found", { status: 404 });
          }
        }
      }
    }
  } catch {
    // fall through – do not block locale preload on guard errors
  }
  await preloadNamespacesWithFallback(lang, ["guides"]);
  await preloadNamespacesWithFallback(lang, ["guidesFallback"], { optional: true, fallbackOptional: false });
  await preloadNamespacesWithFallback(lang, ["guides.tags"], { optional: true, fallbackOptional: true });
  await i18n.changeLanguage(lang);
  return { lang } as const;
}

export default memo(GuidesLayout);

// Provide canonical/meta for the guides hub layout so lints pass and SSG has defaults
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}/${getSlug("guides", lang)}`;
  const title = "guides.meta.index.title";
  const description = "guides.meta.index.description";
  return buildRouteMeta({ lang, title, description, url: `${BASE_URL}${path}`, path });
};

export const links: LinksFunction = () => buildRouteLinks();
