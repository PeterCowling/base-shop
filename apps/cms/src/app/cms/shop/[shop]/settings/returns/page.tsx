// apps/cms/src/app/cms/shop/[shop]/settings/returns/page.tsx
import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const ReturnsEditor = dynamic(() => import("./ReturnsEditor"));
void ReturnsEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function ReturnsSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const returnService =
    settings.returnService ?? {
      upsEnabled: false,
      bagEnabled: false,
      homePickupEnabled: false,
    };
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Returns – {shop}</h2>
        <p className="text-sm text-muted-foreground">
          Enable carrier labels, return bags, and door-to-door pickup support.
        </p>
      </header>
      <ReturnsEditor
        shop={shop}
        initial={{
          upsEnabled: returnService.upsEnabled,
          bagEnabled: returnService.bagEnabled ?? false,
          homePickupEnabled: returnService.homePickupEnabled ?? false,
        }}
      />
    </div>
  );
}
