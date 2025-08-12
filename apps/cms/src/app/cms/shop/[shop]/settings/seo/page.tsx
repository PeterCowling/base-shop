// apps/cms/src/app/cms/shop/[shop]/settings/seo/page.tsx

import { getSettings } from "@cms/actions/shops.server";
import { listEvents } from "@platform-core/repositories/analytics.server";
import dynamic from "next/dynamic";
import SeoProgressPanel from "./SeoProgressPanel";
import AiCatalogSettings from "./AiCatalogSettings";

const SeoEditor = dynamic(() => import("./SeoEditor"));
const SeoAuditPanel = dynamic(() => import("./SeoAuditPanel"));
void SeoEditor;
void SeoAuditPanel;

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
  const [settings, events] = await Promise.all([
    getSettings(shop),
    listEvents(shop),
  ]);
  const languages = settings.languages;
  const seo = settings.seo ?? {};
  const freeze = settings.freezeTranslations ?? false;
  const ai = seo.aiCatalog ?? {
    enabled: false,
    fields: ["id", "title", "description", "price", "images"],
    pageSize: 50,
  };
  const lastCrawl = events
    .filter((e) => e.type === "ai_catalog")
    .map((e) => e.timestamp as string)
    .filter(Boolean)
    .sort()
    .pop();

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
      <AiCatalogSettings
        shop={shop}
        initial={{
          enabled: ai.enabled,
          fields: ai.fields,
          pageSize: ai.pageSize,
          lastCrawl,
        }}
      />
      <SeoAuditPanel shop={shop} />
    </div>
  );
}
