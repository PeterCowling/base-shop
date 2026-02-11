import Link from "next/link";

import { Grid } from "@acme/design-system/primitives/Grid";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { BUSINESSES } from "@/lib/business-catalog";

export const dynamic = "force-static";

export default async function PlansIndexPage() {
  const t = await getServerTranslations("en");
  const operatingBusinesses = BUSINESSES.filter(
    (business) => business.category === "operating-business"
  );
  const internalSystems = BUSINESSES.filter(
    (business) => business.category === "internal-system"
  );

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Plans" },
  ];

  return (
    <div className="bg-surface-1" style={{ minHeight: "100svh" }}>
      <div className="mx-auto w-full px-4 py-8" style={{ maxWidth: "64rem" }}>
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("businessOs.pages.plans.indexTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("businessOs.pages.plans.indexDescription")}
          </p>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("businessOs.pages.plans.sections.operatingBusinesses")}
          </h2>
          <Grid cols={1} gap={4} className="md:grid-cols-2">
            {operatingBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/plans/${business.id}`}
                className="rounded-lg border border-border-2 bg-card p-6 shadow-sm hover:bg-surface-2 transition-colors"
              >
                <div className="text-sm text-muted-foreground font-mono">
                  {business.id}
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {business.name}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {business.description}
                </div>
              </Link>
            ))}
          </Grid>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("businessOs.pages.plans.sections.internalSystems")}
          </h2>
          <Grid cols={1} gap={4} className="md:grid-cols-2">
            {internalSystems.map((business) => (
              <Link
                key={business.id}
                href={`/plans/${business.id}`}
                className="rounded-lg border border-border-2 bg-card p-6 shadow-sm hover:bg-surface-2 transition-colors"
              >
                <div className="text-sm text-muted-foreground font-mono">
                  {business.id}
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {business.name}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {business.description}
                </div>
              </Link>
            ))}
          </Grid>
        </section>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const t = await getServerTranslations("en");
  return {
    title: t("businessOs.pages.plans.indexMetaTitle"),
    description: t("businessOs.pages.plans.indexMetaDescription"),
  };
}
