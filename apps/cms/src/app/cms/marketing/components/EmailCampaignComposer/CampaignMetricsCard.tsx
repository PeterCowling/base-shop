import { Card, CardContent, Skeleton } from "@ui/components/atoms";
import { Grid } from "@ui/components/atoms/primitives";
import { AnalyticsSummaryCard } from "@ui/components/cms/marketing";
import { useTranslations } from "@acme/i18n";
import type { CampaignMetrics } from "./useEmailCampaignComposer";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function formatPercent(value: number): string {
  return clampPercent(value).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export interface CampaignMetricsCardProps {
  campaigns: CampaignMetrics[];
  loading: boolean;
}

export function CampaignMetricsCard({ campaigns, loading }: CampaignMetricsCardProps) {
  const t = useTranslations();
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Grid cols={1} gap={3} className="sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  const now = Date.now();
  let sent = 0;
  let opened = 0;
  let clicked = 0;
  let delivered = 0;
  let scheduled = 0;
  let pending = 0;

  for (const campaign of campaigns) {
    const metrics = campaign.metrics;
    sent += metrics.sent;
    opened += metrics.opened;
    clicked += metrics.clicked;

    if (campaign.sentAt) {
      delivered += 1;
    } else {
      const sendTime = new Date(campaign.sendAt).getTime();
      if (!Number.isNaN(sendTime) && sendTime > now) {
        scheduled += 1;
      } else {
        pending += 1;
      }
    }
  }

  const openRate = sent > 0 ? (opened / sent) * 100 : 0;
  const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;

  const hasCampaigns = campaigns.length > 0;
  const schedulingParts = [
    delivered > 0
      ? String(t("cms.marketing.email.metrics.scheduling.delivered", { count: delivered.toLocaleString() }))
      : null,
    scheduled > 0
      ? String(t("cms.marketing.email.metrics.scheduling.scheduled", { count: scheduled.toLocaleString() }))
      : null,
    pending > 0
      ? String(t("cms.marketing.email.metrics.scheduling.pending", { count: pending.toLocaleString() }))
      : null,
  ].filter(Boolean) as string[];

  const sentHelper = hasCampaigns
    ? schedulingParts.length > 0
      ? schedulingParts.join(" • ")
      : String(t("cms.marketing.email.metrics.sent.helper.awaiting"))
    : String(t("cms.marketing.email.metrics.sent.helper.queue"));
  const statusLabel = hasCampaigns
    ? sent > 0
      ? String(t("cms.marketing.email.metrics.status.live"))
      : String(t("cms.marketing.email.metrics.status.scheduled"))
    : String(t("cms.marketing.email.metrics.status.none"));
  const statusTone = hasCampaigns ? (sent > 0 ? "success" : "warning") : "default";
  const openRateLabel = formatPercent(openRate);
  const clickRateLabel = formatPercent(clickRate);

  return (
    <AnalyticsSummaryCard
      title={t("cms.marketing.email.metrics.title")}
      status={{ label: statusLabel, tone: statusTone }}
      description={t("cms.marketing.email.metrics.description")}
      metrics={[
        {
          label: t("cms.marketing.email.metrics.sent.label"),
          value: sent.toLocaleString(),
          helper: sentHelper,
        },
        {
          label: t("cms.marketing.email.metrics.openRate.label"),
          value: `${openRateLabel}%`,
          progress: {
            value: openRate,
            label: String(
              t("cms.marketing.email.metrics.openRate.progress", {
                count: opened.toLocaleString(),
              })
            ),
          },
          helper:
            sent > 0 ? undefined : t("cms.marketing.email.metrics.openRate.helperEmpty"),
        },
        {
          label: t("cms.marketing.email.metrics.clickRate.label"),
          value: `${clickRateLabel}%`,
          progress: {
            value: clickRate,
            label: String(
              t("cms.marketing.email.metrics.clickRate.progress", {
                count: clicked.toLocaleString(),
              })
            ),
          },
          helper:
            sent > 0 ? undefined : t("cms.marketing.email.metrics.clickRate.helperEmpty"),
        },
        {
          label: t("cms.marketing.email.metrics.activeCampaigns.label"),
          value: campaigns.length.toLocaleString(),
          helper: hasCampaigns
            ? t("cms.marketing.email.metrics.activeCampaigns.helper.hasCampaigns")
            : t("cms.marketing.email.metrics.activeCampaigns.helper.noCampaigns"),
        },
      ]}
      footer={
        hasCampaigns ? (
          <p className="text-xs text-muted-foreground">
            {t("cms.marketing.email.metrics.footer")}
          </p>
        ) : undefined
      }
    />
  );
}

export default CampaignMetricsCard;
