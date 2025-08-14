// apps/cms/src/app/cms/shop/[shop]/settings/luxury-features/page.tsx
import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const LuxuryFeaturesEditor = dynamic(() => import("./LuxuryFeaturesEditor"));
void LuxuryFeaturesEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function LuxuryFeaturesSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const luxury = settings.luxuryFeatures ?? {
    fraudReviewThreshold: 0,
    requireStrongCustomerAuth: false,
  };
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Luxury features – {shop}</h2>
      <LuxuryFeaturesEditor shop={shop} initial={luxury} />
    </div>
  );
}

