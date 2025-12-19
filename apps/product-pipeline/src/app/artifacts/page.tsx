import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Stack } from "@ui/components/atoms/primitives";

export default async function ArtifactsPage() {
  const t = await getTranslations("en");
  const artifacts = [
    {
      title: t("pipeline.artifacts.items.cn044.title"),
      detail: t("pipeline.artifacts.items.cn044.detail"),
      status: t("pipeline.artifacts.items.cn044.status"),
    },
    {
      title: t("pipeline.artifacts.items.cn042.title"),
      detail: t("pipeline.artifacts.items.cn042.detail"),
      status: t("pipeline.artifacts.items.cn042.status"),
    },
    {
      title: t("pipeline.artifacts.items.cn046.title"),
      detail: t("pipeline.artifacts.items.cn046.detail"),
      status: t("pipeline.artifacts.items.cn046.status"),
    },
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.artifacts.badge")}
        title={t("pipeline.artifacts.title")}
        subtitle={t("pipeline.artifacts.subtitle")}
      />

      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {t("pipeline.artifacts.section.label")}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("pipeline.artifacts.section.title")}
          </h2>
        </Stack>
        <Stack gap={4} className="mt-6">
          {artifacts.map((artifact) => (
            <div
              key={artifact.title}
              className="rounded-3xl border border-border-1 bg-surface-2 p-4"
            >
              <div className="text-sm font-semibold">{artifact.title}</div>
              <div className="mt-2 text-xs text-foreground/60">
                {artifact.detail}
              </div>
              <div className="mt-2 text-xs text-foreground/60">
                {t("pipeline.artifacts.fields.status")}: {artifact.status}
              </div>
            </div>
          ))}
        </Stack>
      </section>
    </Stack>
  );
}
