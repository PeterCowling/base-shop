import { Stack } from "@acme/design-system/primitives";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

import PageHeader from "@/components/PageHeader";

export default async function ActivityPage() {
  const t = await getTranslations("en");
  const events = [
    t("pipeline.activity.items.event1"),
    t("pipeline.activity.items.event2"),
    t("pipeline.activity.items.event3"),
    t("pipeline.activity.items.event4"),
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.activity.badge")}
        title={t("pipeline.activity.title")}
        subtitle={t("pipeline.activity.subtitle")}
      />

      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {t("pipeline.activity.section.label")}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("pipeline.activity.section.title")}
          </h2>
        </Stack>
        <Stack gap={3} className="mt-6 text-sm">
          {events.map((event) => (
            <div
              key={event}
              className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
            >
              {event}
            </div>
          ))}
        </Stack>
      </section>
    </Stack>
  );
}
