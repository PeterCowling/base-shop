/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/TravelHelpStructuredData.tsx
import { useTranslation } from "react-i18next";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { articleSlug } from "@/routes.assistance-helpers";
import NEARBY from "@/schema/travel-help/en-nearby.jsonld?raw";
import { HOTEL_ID } from "@/utils/schema";
import { getSlug } from "@/utils/slug";
import { parseTravelHelpResource, type TravelHelpResource } from "@/utils/travelHelp";

export default function TravelHelpStructuredData() {
  const lang = useCurrentLanguage();
  const assistanceSlug = getSlug("assistance", lang);
  const slug = articleSlug(lang, "travelHelp");
  const pageUrl = `${BASE_URL}/${lang}/${assistanceSlug}/${slug}`;

  const translation = useTranslation("travelHelp", { lng: lang });
  const i18nInstance = translation?.i18n;
  const fallbackLangOption = i18nInstance?.options?.fallbackLng;
  const fallbackLang = Array.isArray(fallbackLangOption)
    ? fallbackLangOption[0]
    : typeof fallbackLangOption === "string"
      ? fallbackLangOption
      : "en";

  const getResourceBundle = (lng: string): TravelHelpResource | undefined => {
    const fromDataByLanguage = (() => {
      if (typeof i18nInstance?.getDataByLanguage !== "function") {
        return undefined;
      }
      const data = i18nInstance.getDataByLanguage(lng);
      if (!data) return undefined;
      return data["travelHelp"] as TravelHelpResource | undefined;
    })();

    if (fromDataByLanguage) {
      return fromDataByLanguage;
    }

    if (typeof i18nInstance?.getFixedT !== "function") {
      return undefined;
    }

    const fixedT = i18nInstance.getFixedT(lng, "travelHelp");
    if (typeof fixedT !== "function") {
      return undefined;
    }

    const slugResult = fixedT("slug", { defaultValue: "" }) as unknown;
    const headings = fixedT("headings", { returnObjects: true }) as unknown;
    const content = fixedT("content", { returnObjects: true }) as unknown;

    const resource: TravelHelpResource = {};

    if (typeof slugResult === "string") {
      resource.slug = slugResult;
    }

    if (isRecord(headings)) {
      resource.headings = headings;
    }

    if (isRecord(content)) {
      resource.content = content;
    }

    if (resource.slug || resource.headings || resource.content) {
      return resource;
    }

    return undefined;
  };

  const resource = getResourceBundle(lang);
  const fallbackResource = getResourceBundle(fallbackLang);

  const travelHelp = parseTravelHelpResource(resource, fallbackResource);

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: lang,
    isPartOf: { "@id": `${BASE_URL}#website` },
    mainEntityOfPage: pageUrl,
    mainEntity: travelHelp.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const faqJson = JSON.stringify(faqData);

  // Parse and normalize NEARBY to use the canonical HOTEL_ID and inLanguage
  let nearbyJson = NEARBY;
  let nearbyParsed: NearbyGraph | undefined;
  try {
    const parsed = JSON.parse(NEARBY) as unknown;
    if (isNearbyGraph(parsed)) {
      const graphNodes = parsed["@graph"];
      if (Array.isArray(graphNodes) && areGraphNodes(graphNodes)) {
        parsed["@graph"] = graphNodes.map((node) => {
          if (hasIsLocatedInRecord(node)) {
            return { ...node, isLocatedIn: { "@id": HOTEL_ID } };
          }
          return node;
        });
      }

      parsed.inLanguage = lang;
      parsed.url = pageUrl;
      nearbyParsed = parsed;
      nearbyJson = JSON.stringify(parsed);
    }
  } catch {
    // keep original
  }

  try {
    const snapshot =
      nearbyParsed ??
      (() => {
        try {
          return JSON.parse(nearbyJson) as unknown;
        } catch {
          return nearbyJson;
        }
      })();
    (globalThis as Record<string, unknown>)["nearbyJson"] = snapshot;
  } catch {
    /* noop */
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJson }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: nearbyJson }} />
    </>
  );
}

type GraphNode = Record<string, unknown>;

type NearbyGraph = Record<string, unknown> & {
  "@graph"?: GraphNode[];
  inLanguage?: string;
  url?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNearbyGraph(value: unknown): value is NearbyGraph {
  return isRecord(value);
}

function isGraphNode(value: unknown): value is GraphNode {
  return isRecord(value);
}

function areGraphNodes(nodes: unknown[]): nodes is GraphNode[] {
  return nodes.every(isGraphNode);
}

function hasIsLocatedInRecord(node: GraphNode): node is GraphNode & {
  isLocatedIn: Record<string, unknown>;
} {
  if (!("isLocatedIn" in node)) {
    return false;
  }

  const { isLocatedIn } = node;
  return isRecord(isLocatedIn);
}
