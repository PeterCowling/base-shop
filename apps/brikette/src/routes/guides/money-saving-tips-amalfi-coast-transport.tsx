// src/routes/guides/money-saving-tips-amalfi-coast-transport.tsx
import { memo } from "react";
import GuideSeoTemplate from "./_GuideSeoTemplate";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { MetaFunction, LinksFunction } from "react-router";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { GuideKey } from "@/routes.guides-helpers";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";

export const handle = { tags: ["budgeting", "transport", "tips"] };

export const GUIDE_KEY = "transportMoneySaving" as const satisfies GuideKey;
export const GUIDE_SLUG = "money-saving-tips-amalfi-coast-transport" as const;

function MoneySavingTransportTips(): JSX.Element {
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      showPlanChoice
      showTransportNotice
      relatedGuides={{ items: [{ key: "transportBudget" }, { key: "howToGetToPositano" }, { key: "reachBudget" }] }}
    />
  );
}

export default memo(MoneySavingTransportTips);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "transportMoneySaving", {
    en: () => import("../../locales/en/guides/content/transportMoneySaving.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/transportMoneySaving.json`).catch(() => undefined),
  });
  return { lang } as const;
}

// Helpers used by unit tests
export function resolveTransportString(
  translator: ((key: string) => unknown) | null | undefined,
  key: string,
): string | undefined {
  if (!translator) return undefined;
  const value = translator(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === key) return undefined;
  return trimmed;
}

export function pickTransportContentTranslator<Fn extends (...args: unknown[]) => unknown>(
  primaryMetricA: unknown,
  primaryMetricB: unknown,
  primaryMetricC: unknown,
  fallbackMetricA: unknown,
  fallbackMetricB: unknown,
  fallbackMetricC: unknown,
  primary: Fn,
  fallback: Fn,
): Fn | null {
  const primaryHas = [primaryMetricA, primaryMetricB, primaryMetricC].some((v) => Number(v) > 0);
  const fallbackHas = [fallbackMetricA, fallbackMetricB, fallbackMetricC].some((v) => Number(v) > 0);
  if (primaryHas) return primary;
  if (fallbackHas) return fallback;
  return null;
}

type TransportSection = { id: string; title: string; body: string[] };
type TransportFaq = { question: string; answers: string[] };

export function buildTransportSections(value: unknown): TransportSection[] {
  if (!Array.isArray(value)) return [];
  const result: TransportSection[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const idRaw = rec["id"];
    const titleRaw = rec["title"];
    const bodyRaw = rec["body"];

    const id = typeof idRaw === "string" ? idRaw.trim() : typeof idRaw === "number" ? String(idRaw) : "";
    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    if (!id || !title) continue;

    const body: string[] = Array.isArray(bodyRaw)
      ? bodyRaw
          .map((v) => (typeof v === "number" ? String(v) : typeof v === "string" ? v : null))
          .filter((v): v is string => !!v && v.trim().length > 0)
      : typeof bodyRaw === "string"
      ? [bodyRaw.trim()]
      : typeof bodyRaw === "number"
      ? [String(bodyRaw)]
      : [];

    result.push({ id, title, body });
  }
  return result;
}

export function buildTransportFaqs(value: unknown): TransportFaq[] {
  if (!Array.isArray(value)) return [];
  const result: TransportFaq[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const qRaw = rec["q"];
    const aRaw = rec["a"];

    const question = typeof qRaw === "string" ? qRaw.trim() : "";
    const answers: string[] = Array.isArray(aRaw)
      ? aRaw
          .map((v) => (typeof v === "number" ? String(v) : typeof v === "string" ? v : null))
          .filter((v): v is string => !!v && v.trim().length > 0)
      : typeof aRaw === "string"
      ? [aRaw.trim()]
      : typeof aRaw === "number"
      ? [String(aRaw)]
      : [];

    if (!question || answers.length === 0) continue;
    result.push({ question, answers });
  }
  return result;
}

export function buildTransportTableOfContents(
  sections: Array<{ id: string; title: string; body: string[] }>,
  faqs: Array<{ question: string; answers: string[] }>,
  faqsLabel?: string,
) {
  const toc = sections.map((s) => ({ href: `#${s.id}`, label: s.title }));
  if (faqs.length > 0) {
    toc.push({ href: "#faqs", label: faqsLabel ? faqsLabel : "FAQs" });
  }
  return toc;
}

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_DIMS.width,
    height: OG_DIMS.height,
    quality: 85,
    format: "auto",
  });
  const title = `guides.meta.${GUIDE_KEY}.title`;
  const description = `guides.meta.${GUIDE_KEY}.description`;
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_DIMS.width, height: OG_DIMS.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

