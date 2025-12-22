// src/routes/guides/draft.index.tsx
/* eslint-disable ds/no-hardcoded-copy -- TECH-DEBT-000 [ttl=2025-12-31] Editorial dashboard copy awaiting i18n coverage */
import { useMemo } from "react";
import { Section } from "@acme/ui/atoms/Section";
import { Cluster, Inline, Stack } from "@/components/ui/flex";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import type { LinksFunction, MetaFunction } from "react-router";

import type { GuideSeoTemplateProps } from "./guide-seo/types";
import type {} from "./_GuideSeoTemplate";

import {
  buildGuideChecklist,
  guideAreaToSlugKey,
  listGuideManifestEntries,
  resolveDraftPathSegment,
  type ChecklistSnapshot,
  type GuideManifestEntry,
} from "./guide-manifest";

import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import i18n from "@/i18n";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import type { AppLanguage } from "@/i18n.config";
import { BASE_URL } from "@/config/site";

// This dashboard does not map to a real guide route. Expose null markers so the
// slug manifest generator skips it while the lint rule still sees the exports.
export const GUIDE_KEY = null;
export const GUIDE_SLUG = null;

type DraftGuideSummary = {
  key: GuideSeoTemplateProps["guideKey"];
  slug: string;
  status: GuideManifestEntry["status"];
  areas: GuideManifestEntry["areas"];
  primaryArea: GuideManifestEntry["primaryArea"];
  checklist: ChecklistSnapshot;
  draftPath: string;
};

type LoaderData = {
  lang: AppLanguage;
  guides: DraftGuideSummary[];
};

function buildSummary(entry: GuideManifestEntry): DraftGuideSummary {
  return {
    key: entry.key,
    slug: entry.slug,
    status: entry.status,
    areas: entry.areas,
    primaryArea: entry.primaryArea,
    checklist: buildGuideChecklist(entry),
    draftPath: resolveDraftPathSegment(entry),
  };
}

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request) as AppLanguage;
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  const summaries = listGuideManifestEntries().map(buildSummary);
  return { lang, guides: summaries } satisfies LoaderData;
}

export { clientLoader as loader };

type DraftGuideStatus = DraftGuideSummary["status"];

const STATUS_LABEL: Record<DraftGuideStatus, string> = {
  draft: "Draft",
  review: "In review",
  live: "Live",
};

const STATUS_CLASS: Record<DraftGuideStatus, string> = {
  draft: "text-brand-terra bg-brand-terra/10 border border-brand-terra/30",
  review: "text-brand-primary bg-brand-primary/10 border border-brand-primary/25",
  live: "text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/25",
};

const AREA_LABELS: Record<GuideManifestEntry["primaryArea"], string> = {
  experience: "Experiences",
  help: "Help centre",
  howToGetHere: "How to get here",
};

function DraftGuidesDashboard(): JSX.Element {
  const { lang, guides } = useLoaderData() as LoaderData;

  const sortedGuides = useMemo(() => {
    return [...guides].sort((a, b) => {
      if (a.status === b.status) return a.slug.localeCompare(b.slug);
      const order: DraftGuideStatus[] = ["draft", "review", "live"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
  }, [guides]);

  return (
    <Section as="main" className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Stack as="header" className="gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">
          Guides editorial
        </p>
        <h1 className="text-2xl font-semibold text-brand-heading">Draft & publication checklist</h1>
        <p className="text-sm text-brand-text/80">
          Every guide listed here can be previewed under the draft URL. Use the checklist to confirm
          translations, structured data, FAQs, and media are ready before promoting a guide to live.
        </p>
      </Stack>

      <section className="overflow-x-auto rounded-xl border border-brand-outline/20 bg-brand-surface shadow-sm">
        <table className="min-w-full divide-y divide-brand-outline/20 text-sm text-brand-text">
          <thead className="bg-brand-surface/80">
            <tr>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Guide</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Publish to</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Status</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Outstanding</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Draft preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-outline/10">
            {sortedGuides.map((guide) => {
              const outstanding = guide.checklist.items.filter((item) => item.status !== "complete");
              const publishAreas = Array.from(new Set([guide.primaryArea, ...guide.areas]));
              return (
                <tr key={guide.key} className="align-top">
                  <td className="px-4 py-3">
                    <Stack className="gap-1">
                      <p className="font-semibold text-brand-heading">{guide.slug}</p>
                      <p className="text-xs uppercase tracking-wide text-brand-text/60">
                        {guide.key}
                      </p>
                    </Stack>
                  </td>
                  <td className="px-4 py-3">
                    <Cluster>
                      {publishAreas.map((area) => {
                        const label = AREA_LABELS[area] ?? area;
                        const primary = area === guide.primaryArea;
                        return (
                          <Inline
                            key={`${guide.key}-${area}`}
                            className={`gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                              primary
                                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                : "border-brand-outline/30 bg-brand-surface/70 text-brand-text/80"
                            }`}
                          >
                            {label}
                            {primary ? (
                              <span className="text-xs uppercase tracking-wide text-brand-primary">
                                Primary
                              </span>
                            ) : null}
                          </Inline>
                        );
                      })}
                    </Cluster>
                  </td>
                  <td className="px-4 py-3">
                    <Inline
                      as="span"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[guide.status]}`}
                    >
                      {STATUS_LABEL[guide.status]}
                    </Inline>
                  </td>
                  <td className="px-4 py-3">
                    <Stack className="gap-1">
                      {outstanding.length === 0 ? (
                        <span className="text-sm font-medium text-brand-secondary">All tasks complete</span>
                      ) : (
                        outstanding.map((item) => (
                          <Inline
                            key={item.id}
                            className="gap-2 text-sm text-brand-text/90"
                          >
                            <span className="h-2 w-2 rounded-full bg-brand-secondary" />
                            {item.note ?? item.id}
                          </Inline>
                        ))
                      )}
                    </Stack>
                  </td>
                  <td className="px-4 py-3">
                    <Stack className="gap-2">
                      <Inline
                        as={Link}
                        to={`/${lang}/draft/${guide.draftPath}`}
                        className="rounded-md border border-brand-outline/20 px-3 py-1 text-xs font-semibold text-brand-text/80 transition-colors hover:border-brand-outline/30 hover:bg-brand-surface/80"
                      >
                        Open draft
                      </Inline>
                      <Inline
                        as={Link}
                        to={`/${lang}/${getSlug(
                          guideAreaToSlugKey(guide.primaryArea),
                          lang,
                        )}/${guideSlug(lang, guide.key)}`}
                        className="block text-xs font-medium text-brand-primary underline transition-colors hover:text-brand-primary/80"
                      >
                        View live route
                      </Inline>
                    </Stack>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </Section>
  );
}

export default DraftGuidesDashboard;

export const meta: MetaFunction = ({ data }) => {
  const payload = (data ?? {}) as Partial<LoaderData>;
  const lang = payload.lang ?? "en";
  const path = `/${lang}/draft`;
  return buildRouteMeta({
    lang: lang as AppLanguage,
    title: "Guides draft dashboard",
    description: "Track publication status and outstanding tasks for every guide.",
    url: `${BASE_URL}${path}`,
    path,
    ogType: "website",
  });
};

export const links: LinksFunction = () => buildRouteLinks();
