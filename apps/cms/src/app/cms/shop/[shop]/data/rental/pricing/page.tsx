import { checkShopExists } from "@acme/lib";
import { readPricing } from "@platform-core/repositories/pricing.server";
import { notFound } from "next/navigation";
import PricingForm from "./PricingForm";

export const revalidate = 0;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readPricing();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Rental Pricing</h2>
      <PricingForm shop={shop} initial={initial} />
    </div>
  );
}
