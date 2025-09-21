import Link from "next/link";
import { Card, CardContent } from "@/components/atoms/shadcn";

import type { ServiceEditorLink } from "../lib/pageSections";

interface ServiceAutomationGridProps {
  readonly services: ServiceEditorLink[];
}

export default function ServiceAutomationGrid({
  services,
}: ServiceAutomationGridProps) {
  return (
    <section id="service-editors" aria-labelledby="service-editors-heading" className="space-y-4">
      <div className="space-y-2">
        <h2 id="service-editors-heading" className="text-xl font-semibold">
          Service automation
        </h2>
        <p className="text-sm text-muted-foreground">
          Each editor configures background jobs and optional plugins for this shop.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <Card key={service.href} className="h-full border border-border-3">
            <CardContent className="flex h-full flex-col justify-between gap-4 p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              <Link
                href={service.href}
                className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
              >
                Manage {service.name}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
