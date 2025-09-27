import Link from "next/link";
import { Button, Card, CardContent, Tag } from "@/components/atoms/shadcn";
import { useTranslations } from "@acme/i18n";
import type { Stats } from "@cms/lib/dashboardData";

type ShopOverviewCardProps = {
  stats: Stats;
  pendingCount: number;
};

export function ShopOverviewCard({ stats, pendingCount }: ShopOverviewCardProps) {
  const { shops, products, users } = stats;
  const t = useTranslations();

  return (
    <Card className="border border-border-3">
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{t("Shop overview")}</h2>
          <p className="text-sm text-foreground">
            {t(
              "Track the health of your storefront network and jump into the right workspace."
            )}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-3 bg-surface-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("Operational footprint")}</p>
              <p className="text-xs text-foreground">
                {shops === 0
                  ? t("No storefronts live yet")
                  : t(`${shops} ${shops === 1 ? "shop" : "shops"} ready for merchandising`)}
              </p>
            </div>
            <Tag className="shrink-0" variant={shops > 0 ? "default" : "warning"}>
              {shops > 0 ? t("Active") : t("Needs setup")}
            </Tag>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-3 bg-surface-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("Catalog depth")}</p>
              <p className="text-xs text-foreground">
                {products === 0
                  ? t("Start importing products")
                  : t(`${products} items available across all shops`)}
              </p>
            </div>
            <Tag className="shrink-0" variant={products > 0 ? "default" : "warning"}>
              {products > 0 ? t("Populated") : t("Empty")}
            </Tag>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-3 bg-surface-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t("Team access")}</p>
              <p className="text-xs text-foreground">
                {users === 0
                  ? t("Invite collaborators to share the workload")
                  : t(`${users} active ${users === 1 ? "member" : "members"}`)}
              </p>
            </div>
            <Tag className="shrink-0" variant={pendingCount === 0 ? "success" : "warning"}>
              {pendingCount === 0 ? t("Stable") : t(`${pendingCount} pending`)}
            </Tag>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/cms/live">{t("Open live previews")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/cms/maintenance">{t("Run maintenance scan")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
