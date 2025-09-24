import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Alert } from "@ui/components/atoms";
import type { Shop } from "@acme/types";

const ShopEditor = dynamic(() => import("../ShopEditor"));
void ShopEditor;
const CurrencyTaxEditor = dynamic(() => import("../CurrencyTaxEditor"));
void CurrencyTaxEditor;

interface AdminToolsProps {
  readonly isAdmin: boolean;
  readonly shop: string;
  readonly shopInfo: Shop;
  readonly trackingProviders: string[];
  readonly currency: string;
  readonly taxRegion: string;
}

export default function AdminTools({
  isAdmin,
  shop,
  shopInfo,
  trackingProviders,
  currency,
  taxRegion,
}: AdminToolsProps) {
  if (!isAdmin) {
    return (
      <Alert variant="warning" tone="soft" title="You are signed in as a viewer. Editing is disabled." />
    );
  }

  return (
    <section id="admin-tools" aria-labelledby="admin-tools-heading" className="space-y-4">
      <div className="space-y-2">
        <h2 id="admin-tools-heading" className="text-xl font-semibold">
          Admin tools
        </h2>
        <p className="text-sm text-muted-foreground">
          Update storefront metadata, providers, and financial settings for this shop.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Shop profile</h3>
            <p className="text-sm text-muted-foreground">
              Manage general details, theme options, and provider integrations.
            </p>
          </div>
          <ShopEditor
            shop={shop}
            initial={shopInfo}
            initialTrackingProviders={trackingProviders}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Currency &amp; tax</h3>
            <p className="text-sm text-muted-foreground">
              Set the defaults used for checkout and invoicing.
            </p>
          </div>
          <CurrencyTaxEditor
            shop={shop}
            initial={{
              currency,
              taxRegion,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
