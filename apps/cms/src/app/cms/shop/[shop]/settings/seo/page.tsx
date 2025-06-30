// apps/cms/src/app/cms/shop/[shop]/settings/seo/page.tsx

import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const SeoEditor = dynamic(() => import("./SeoEditor"));
void SeoEditor;

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

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">SEO – {shop}</h2>
      <SeoEditor shop={shop} languages={languages} initialSeo={seo} />
    </div>
  );
}
