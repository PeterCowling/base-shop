// apps/cms/src/app/cms/blog/sanity/connect/page.tsx
import ConnectForm from "./ConnectForm.client";
import { getShopById } from "@platform-core/repositories/shop.server";
import { getSanityConfig } from "@platform-core/shops";

export const revalidate = 0;

export default async function SanityConnectPage({
  searchParams,
}: {
  searchParams?: { shopId?: string };
}) {
  const shopId = searchParams?.shopId;
  if (!shopId) return <p>No shop selected.</p>;
  const shop = await getShopById(shopId);
  const sanity = getSanityConfig(shop);
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Connect Sanity</h2>
      <ConnectForm shopId={shopId} initial={sanity} />
    </div>
  );
}
