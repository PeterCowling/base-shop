// apps/cms/src/app/cms/shop/[shop]/settings/seo/page.tsx

import dynamic from "next/dynamic";
import { getSettings } from "@cms/actions/shops.server";

import { Inline } from "@acme/design-system/primitives/Inline";
import { PRODUCTS } from "@acme/platform-core/products";
import { listEvents } from "@acme/platform-core/repositories/analytics.server";
import { readRepo } from "@acme/platform-core/repositories/products.server";
import { readSeoAudits } from "@acme/platform-core/repositories/seoAudit.server";
import type { ProductPublication } from "@acme/types";

import { Chip } from "@/components/atoms/Chip";

import AiCatalogSettings from "./AiCatalogSettings";
import AiFeedPanel from "./AiFeedPanel";
import SeoIssuesBanner from "./SeoIssuesBanner";
import SeoProgressPanel from "./SeoProgressPanel";
import SitemapStatusPanel from "./SitemapStatusPanel";

const SeoEditor = dynamic(() => import("./SeoEditor"));
const SeoAuditPanel = dynamic(() => import("./SeoAuditPanel"));
void SeoEditor;
void SeoAuditPanel;

export const revalidate = 0;

interface Params {
  shop: string;
}

interface EventRecord {
  shop?: string;
  type?: string;
  timestamp?: string;
}

export default async function SeoSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const [settings, eventsRaw, audits, productsRaw] = await Promise.all([
    getSettings(shop),
    listEvents(),
    readSeoAudits(shop),
    readRepo<ProductPublication>(shop),
  ]);
  const events = eventsRaw as EventRecord[];
  const languages = settings.languages ?? [];
  const seo = settings.seo ?? {};
  const freeze = settings.freezeTranslations ?? false;
  const ai = seo.aiCatalog ?? {
    enabled: false,
    fields: ["id", "title", "description", "price", "media"],
    pageSize: 50,
  };
  const lastCrawl = (events as EventRecord[])
    .filter((e) => e.shop === shop)
    .filter((e) => e.type === "ai_crawl")
    .map((e) => e.timestamp as string)
    .filter(Boolean)
    .sort()
    .pop();

  const missingTitles = languages.filter(
    (lang) => !(seo as Record<string, { title?: string }>)[lang]?.title,
  );
  const missingDescriptions = languages.filter(
    (lang) => !(seo as Record<string, { description?: string }>)[lang]?.description,
  );
  const invalidStructuredData = languages.filter((lang) => {
    const sd = (seo as Record<string, { structuredData?: string }>)[lang]?.structuredData;
    if (!sd) return false;
    try {
      JSON.parse(sd);
      return false;
    } catch {
      return true;
    }
  });
  const products = Array.isArray(productsRaw) && productsRaw.length > 0 ? productsRaw : PRODUCTS;
  const aiFields = ai.fields?.length ? ai.fields : ["id", "title", "description", "price", "media"];

  const issues: { id: string; title: string; href: string; detail?: string }[] = [];
  if (missingTitles.length > 0 || missingDescriptions.length > 0) {
    issues.push({
      id: "seo-content",
      title: "Add titles/descriptions for all languages",
      href: "#seo-editor",
      detail: `Missing: ${
        missingTitles.length ? `titles ${missingTitles.join(", ")} ` : ""
      }${missingDescriptions.length ? `descriptions ${missingDescriptions.join(", ")}` : ""}`.trim(),
    });
  }
  const lastAuditTs = audits.at(-1)?.timestamp
    ? new Date(audits.at(-1)!.timestamp).getTime()
    : undefined;
  const auditStale =
    lastAuditTs === undefined || Date.now() - lastAuditTs > 1000 * 60 * 60 * 24 * 30;

  if (!ai.enabled) {
    issues.push({
      id: "ai-feed-disabled",
      title: "AI catalog feed is disabled",
      href: "#ai-catalog",
      detail: "Enable the feed so crawlers can discover products.",
    });
  }
  if (ai.enabled && products.length === 0) {
    issues.push({
      id: "ai-feed-empty",
      title: "AI catalog feed has no items",
      href: "#ai-catalog",
      detail: "Add products or publications so the feed is not empty.",
    });
  }
  if (ai.enabled && (products.length === 0 || !aiFields.includes("id") || !aiFields.includes("title"))) {
    issues.push({
      id: "ai-feed-preview",
      title: "Preview AI feed to debug configuration",
      href: "#ai-catalog",
      detail: "Open feed preview to confirm items and fields before enabling.",
    });
  }
  // AI feed staleness: no crawl in last 7 days
  const lastCrawlTs = lastCrawl ? new Date(lastCrawl).getTime() : undefined;
  const crawlStale = ai.enabled && (!lastCrawlTs || Date.now() - lastCrawlTs > 7 * 24 * 60 * 60 * 1000);
  if (crawlStale) {
    issues.push({
      id: "ai-feed-stale-time",
      title: "AI catalog feed is stale",
      href: "#ai-feed",
      detail: "No AI crawl in the last 7 days. Queue a crawl to refresh.",
    });
  }
  if (!lastCrawl) {
    issues.push({
      id: "ai-feed-stale",
      title: "No AI crawl activity yet",
      href: "#ai-feed",
      detail: "Queue a crawl to publish the latest feed.",
    });
  }
  if (auditStale) {
    issues.push({
      id: "seo-audit-stale",
      title: "Run an SEO audit (Lighthouse)",
      href: "#seo-audit",
      detail: lastAuditTs
        ? "Last audit is over 30 days old; re-run to refresh recommendations."
        : "No audits recorded yet.",
    });
  }
  if (invalidStructuredData.length > 0) {
    issues.push({
      id: "structured-data-invalid",
      title: "Fix structured data JSON",
      href: `#seo-editor-${invalidStructuredData[0]}`,
      detail: `Invalid JSON in locales: ${invalidStructuredData.join(", ")}`,
    });
  }
  if (ai.enabled) {
    const missingFields = ["id", "title"].filter((f) => !aiFields.includes(f));
    if (missingFields.length > 0) {
      issues.push({
        id: "ai-feed-fields",
        title: "AI catalog missing required fields",
        href: "#ai-catalog",
        detail: `Add required fields: ${missingFields.join(", ")}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">SEO – {shop}</h2>
      <Inline wrap gap={2} aria-label="Locale completeness">
        {languages.map((lang) => {
          const record = (seo as Record<string, { title?: string; description?: string }>)[lang];
          const complete = Boolean(record?.title && record?.description);
          return (
            <Chip
              key={lang}
              color={complete ? "success" : "warning"}
              tone="soft"
              size="sm"
            >
              {lang.toUpperCase()} — {complete ? "Complete" : "Needs content"}
            </Chip>
          );
        })}
      </Inline>
      {issues.length > 0 && <SeoIssuesBanner shop={shop} issues={issues} />}
      <SeoProgressPanel shop={shop} />
      <section id="seo-editor" className="scroll-m-16">
        <SeoEditor
          shop={shop}
          languages={languages}
          initialSeo={seo}
          initialFreeze={freeze}
        />
      </section>
      <section id="ai-catalog" className="scroll-m-16">
        <AiCatalogSettings
          shop={shop}
          initial={{
            enabled: ai.enabled,
            fields: ai.fields,
            pageSize: ai.pageSize,
            lastCrawl,
          }}
        />
      </section>
      <section id="ai-feed" className="scroll-m-16">
        <AiFeedPanel shop={shop} />
      </section>
      <section id="seo-sitemap" className="scroll-m-16">
        <SitemapStatusPanel />
      </section>
      <section id="seo-audit" className="scroll-m-16">
        <SeoAuditPanel shop={shop} />
      </section>
    </div>
  );
}
