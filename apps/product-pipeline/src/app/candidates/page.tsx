import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Cluster, Grid, Inline, Stack } from "@ui/components/atoms/primitives";

export default async function CandidatesPage() {
  const t = await getTranslations("en");
  const candidates = [
    {
      id: "CN-042",
      title: t("pipeline.candidates.items.cn042.title"),
      returnBand: t("pipeline.candidates.items.cn042.returnBand"),
      peakCash: t("pipeline.candidates.items.cn042.peakCash"),
      payback: t("pipeline.candidates.items.cn042.payback"),
      risk: t("pipeline.candidates.items.cn042.risk"),
      effort: t("pipeline.candidates.items.cn042.effort"),
      stage: t("pipeline.candidates.items.cn042.stage"),
    },
    {
      id: "CN-044",
      title: t("pipeline.candidates.items.cn044.title"),
      returnBand: t("pipeline.candidates.items.cn044.returnBand"),
      peakCash: t("pipeline.candidates.items.cn044.peakCash"),
      payback: t("pipeline.candidates.items.cn044.payback"),
      risk: t("pipeline.candidates.items.cn044.risk"),
      effort: t("pipeline.candidates.items.cn044.effort"),
      stage: t("pipeline.candidates.items.cn044.stage"),
    },
    {
      id: "CN-046",
      title: t("pipeline.candidates.items.cn046.title"),
      returnBand: t("pipeline.candidates.items.cn046.returnBand"),
      peakCash: t("pipeline.candidates.items.cn046.peakCash"),
      payback: t("pipeline.candidates.items.cn046.payback"),
      risk: t("pipeline.candidates.items.cn046.risk"),
      effort: t("pipeline.candidates.items.cn046.effort"),
      stage: t("pipeline.candidates.items.cn046.stage"),
    },
  ];

  const compareItems = [
    t("pipeline.candidates.section.compare.items.price"),
    t("pipeline.candidates.section.compare.items.freight"),
    t("pipeline.candidates.section.compare.items.leadTime"),
  ];

  const decisionItems = [
    t("pipeline.candidates.section.decisions.items.negotiation"),
    t("pipeline.candidates.section.decisions.items.eligibility"),
    t("pipeline.candidates.section.decisions.items.hazmat"),
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.candidates.badge")}
        title={t("pipeline.candidates.title")}
        subtitle={t("pipeline.candidates.subtitle")}
      />

      <section className="pp-card p-6">
        <Cluster justify="between" alignY="center" className="gap-4">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.candidates.section.ranked.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.candidates.section.ranked.title")}
            </h2>
          </Stack>
          <button className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            {t("pipeline.candidates.actions.runStageK")}
          </button>
        </Cluster>

        <Stack gap={4} className="mt-6">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="rounded-3xl border border-border-1 bg-surface-2 p-4"
            >
              <Cluster justify="between" alignY="center" className="gap-4">
                <Stack gap={1}>
                  <span className="text-xs text-foreground/60">
                    {candidate.id}
                  </span>
                  <span className="text-lg font-semibold">
                    {candidate.title}
                  </span>
                  <span className="text-xs text-foreground/60">
                    {t("pipeline.candidates.fields.stage")}: {candidate.stage}
                  </span>
                </Stack>
                <Inline gap={4} alignY="center" className="text-sm">
                  <Stack gap={1}>
                    <span className="text-xs text-foreground/60">
                      {t("pipeline.candidates.fields.returnBand")}
                    </span>
                    <span className="font-semibold">{candidate.returnBand}</span>
                  </Stack>
                  <Stack gap={1}>
                    <span className="text-xs text-foreground/60">
                      {t("pipeline.candidates.fields.peakCash")}
                    </span>
                    <span className="font-semibold">{candidate.peakCash}</span>
                  </Stack>
                  <Stack gap={1}>
                    <span className="text-xs text-foreground/60">
                      {t("pipeline.candidates.fields.payback")}
                    </span>
                    <span className="font-semibold">{candidate.payback}</span>
                  </Stack>
                </Inline>
              </Cluster>
              <Inline gap={3} className="mt-4 text-xs">
                <span className="rounded-full border border-border-2 px-3 py-1">
                  {t("pipeline.candidates.tags.risk")}: {candidate.risk}
                </span>
                <span className="rounded-full border border-border-2 px-3 py-1">
                  {t("pipeline.candidates.tags.effort")}: {candidate.effort}
                </span>
                <span className="rounded-full border border-border-2 px-3 py-1">
                  {t("pipeline.candidates.tags.next")}
                </span>
              </Inline>
            </div>
          ))}
        </Stack>
      </section>

      <Grid cols={1} gap={4} className="md:grid-cols-2">
        <div className="pp-card p-6">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.candidates.section.compare.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.candidates.section.compare.title")}
            </h2>
          </Stack>
          <Stack gap={3} className="mt-4 text-sm text-foreground/70">
            {compareItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </Stack>
        </div>
        <div className="pp-card p-6">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.candidates.section.decisions.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.candidates.section.decisions.title")}
            </h2>
          </Stack>
          <Stack gap={3} className="mt-4 text-sm">
            {decisionItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
              >
                {item}
              </div>
            ))}
          </Stack>
        </div>
      </Grid>
    </Stack>
  );
}
