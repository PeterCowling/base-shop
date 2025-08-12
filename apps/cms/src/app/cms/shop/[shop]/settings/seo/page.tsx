// apps/cms/src/app/cms/shop/[shop]/settings/seo/page.tsx

import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";
import SeoProgressPanel from "./SeoProgressPanel";
import { listEvents } from "@platform-core/repositories/analytics.server";

const SeoEditor = dynamic(() => import("./SeoEditor"));
const SeoAuditPanel = dynamic(() => import("./SeoAuditPanel"));
const AiCatalogForm = dynamic(() => import("./AiCatalogForm"));
void SeoEditor;
void SeoAuditPanel;
void AiCatalogForm;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function SeoSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const languages = settings.languages;
  const seo = settings.seo ?? {};
  const ai = seo.aiCatalog ?? { fields: ["id", "title", "description", "price", "images"], pageSize: 50 };
  const freeze = settings.freezeTranslations ?? false;
  const events = await listEvents(shop);
  const lastCrawl = events
    .filter((e) => e.type === "ai_catalog_crawl" && e.timestamp)
    .map((e) => e.timestamp as string)
    .sort()
    .at(-1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">SEO – {shop}</h2>
      <SeoProgressPanel shop={shop} />
      <SeoEditor
        shop={shop}
        languages={languages}
        initialSeo={seo}
        initialFreeze={freeze}
      />
      <AiCatalogForm
        shop={shop}
        initialFields={ai.fields}
        initialPageSize={ai.pageSize ?? 50}
        lastCrawl={lastCrawl}
      />
      <SeoAuditPanel shop={shop} />
    </div>
  );
}
