// apps/cms/src/app/cms/blog/sanity/connect/page.tsx
import ConnectForm from "./ConnectForm.client";
import { getShopById } from "@acme/platform-core/repositories/shop.server";
import { getSanityConfig } from "@acme/platform-core/shops";

export const revalidate = 0;

export default async function SanityConnectPage({
  searchParams,
}: {
  searchParams?: Promise<{ shopId?: string }>;
}) {
  const sp = (await searchParams) ?? undefined;
  const shopId = sp?.shopId;
  if (!shopId) return <p>No shop selected.</p>;
  const shop = await getShopById(shopId);
  const sanity = getSanityConfig(shop) as
    | { projectId: string; dataset: string; token?: string }
    | undefined;
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Connect Sanity</h2>
      <ConnectForm shopId={shopId} initial={sanity} />
    </div>
  );
}
