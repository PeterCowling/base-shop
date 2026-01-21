import Link from "next/link";

import { useTranslations } from "@acme/i18n";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives/Grid";

import { Card, CardContent } from "@/components/atoms/shadcn";

import type { ServiceEditorLink } from "../lib/pageSections";

interface ServiceAutomationGridProps {
  readonly services: ServiceEditorLink[];
}

export default function ServiceAutomationGrid({
  services,
}: ServiceAutomationGridProps) {
  const t = useTranslations();
  return (
    <section
      id="service-editors" // i18n-exempt -- CMS-000 non-UI element id [ttl=2026-12-31]
      aria-labelledby="service-editors-heading" // i18n-exempt -- CMS-000 non-UI element id [ttl=2026-12-31]
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2
          id="service-editors-heading" // i18n-exempt -- CMS-000 non-UI element id [ttl=2026-12-31]
          className="text-xl font-semibold"
        >
          {t("cms.shop.settings.serviceAutomation.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("cms.shop.settings.serviceAutomation.desc")}</p>
      </div>
      <DSGrid gap={4} className="sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <Card key={service.href} className="h-full border border-border-3">
            <CardContent className="flex h-full flex-col justify-between gap-4 p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              <Link
                href={service.href}
                className="inline-flex items-center text-sm font-semibold text-link hover:text-link/80"
              >
                {t("cms.shop.settings.serviceAutomation.manageCta", { name: service.name })}
              </Link>
            </CardContent>
          </Card>
        ))}
      </DSGrid>
    </section>
  );
}
