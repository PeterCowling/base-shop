import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Stack } from "@acme/design-system/primitives";

import PageHeader from "@/components/PageHeader";

export default async function SuppliersPage() {
  const t = await getTranslations("en");
  const suppliers = [
    {
      name: t("pipeline.suppliers.items.shenzhen.name"),
      terms: t("pipeline.suppliers.items.shenzhen.terms"),
      status: t("pipeline.suppliers.items.shenzhen.status"),
    },
    {
      name: t("pipeline.suppliers.items.ningbo.name"),
      terms: t("pipeline.suppliers.items.ningbo.terms"),
      status: t("pipeline.suppliers.items.ningbo.status"),
    },
    {
      name: t("pipeline.suppliers.items.foshan.name"),
      terms: t("pipeline.suppliers.items.foshan.terms"),
      status: t("pipeline.suppliers.items.foshan.status"),
    },
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.suppliers.badge")}
        title={t("pipeline.suppliers.title")}
        subtitle={t("pipeline.suppliers.subtitle")}
      />

      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {t("pipeline.suppliers.section.label")}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("pipeline.suppliers.section.title")}
          </h2>
        </Stack>
        <Stack gap={4} className="mt-6">
          {suppliers.map((supplier) => (
            <div
              key={supplier.name}
              className="rounded-3xl border border-border-1 bg-surface-2 p-4"
            >
              <div className="text-lg font-semibold">{supplier.name}</div>
              <div className="mt-2 text-sm text-foreground/70">
                {t("pipeline.suppliers.fields.terms")}: {supplier.terms}
              </div>
              <div className="mt-2 text-xs text-foreground/60">
                {t("pipeline.suppliers.fields.status")}: {supplier.status}
              </div>
            </div>
          ))}
        </Stack>
      </section>
    </Stack>
  );
}
