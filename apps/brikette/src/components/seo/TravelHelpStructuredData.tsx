 
// src/components/seo/TravelHelpStructuredData.tsx
import { useTranslation } from "react-i18next";

import { buildCanonicalUrl } from "@acme/ui/lib/seo";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { articleSlug } from "@/routes.assistance-helpers";
import NEARBY from "@/schema/travel-help/en-nearby.jsonld?raw";
import { HOTEL_ID } from "@/utils/schema";
import { getSlug } from "@/utils/slug";
import { buildFaqJsonLd } from "@/utils/buildFaqJsonLd";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

import FaqJsonLdScript from "./FaqJsonLdScript";
import { parseTravelHelpResource, type TravelHelpResource } from "@/utils/travelHelp";

export default function TravelHelpStructuredData() {
  const lang = useCurrentLanguage();
  const assistanceSlug = getSlug("assistance", lang);
  const slug = articleSlug(lang, "travelHelp");
  const pagePath = `/${lang}/${assistanceSlug}/${slug}`;
  const pageUrl = buildCanonicalUrl(BASE_URL, pagePath);

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

  const faqPayload = buildFaqJsonLd(
    lang,
    pageUrl,
    travelHelp.items.map((item) => ({ question: item.question, answer: item.answer })),
  );
  const faqData = faqPayload
    ? {
        ...faqPayload,
        "@id": `${pageUrl}#faq`,
        isPartOf: { "@id": `${BASE_URL}#website` },
        mainEntityOfPage: pageUrl,
      }
    : null;
  // Parse and normalize NEARBY to use the canonical HOTEL_ID and inLanguage
  let nearbyJson = "";
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
      nearbyJson = serializeJsonLdValue(parsed);
    }
  } catch {
    nearbyJson = serializeJsonLdValue(NEARBY);
  }

  return (
    <>
      <FaqJsonLdScript data={faqData} />
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
