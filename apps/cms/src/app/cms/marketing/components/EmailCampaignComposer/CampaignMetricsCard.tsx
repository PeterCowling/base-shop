import { Card, CardContent, Skeleton } from "@ui/components/atoms";
import { AnalyticsSummaryCard } from "@ui/components/cms/marketing";
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
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
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
    delivered > 0 ? `${delivered} delivered` : null,
    scheduled > 0 ? `${scheduled} scheduled` : null,
    pending > 0 ? `${pending} pending` : null,
  ].filter(Boolean) as string[];

  const sentHelper = hasCampaigns
    ? schedulingParts.length > 0
      ? schedulingParts.join(" • ")
      : "Awaiting delivery to calculate engagement."
    : "Queue a campaign to start collecting metrics.";
  const statusLabel = hasCampaigns ? (sent > 0 ? "Live metrics" : "Scheduled") : "No campaigns";
  const statusTone = hasCampaigns ? (sent > 0 ? "success" : "warning") : "default";
  const openRateLabel = formatPercent(openRate);
  const clickRateLabel = formatPercent(clickRate);

  return (
    <AnalyticsSummaryCard
      title="Campaign metrics"
      status={{ label: statusLabel, tone: statusTone }}
      description="Monitor delivery and engagement as campaigns are queued for this shop."
      metrics={[
        {
          label: "Emails sent",
          value: sent.toLocaleString(),
          helper: sentHelper,
        },
        {
          label: "Open rate",
          value: `${openRateLabel}%`,
          progress: {
            value: openRate,
            label: `${opened.toLocaleString()} opens`,
          },
          helper: sent > 0 ? undefined : "Open rate will populate after delivery completes.",
        },
        {
          label: "Click rate",
          value: `${clickRateLabel}%`,
          progress: {
            value: clickRate,
            label: `${clicked.toLocaleString()} clicks`,
          },
          helper: sent > 0 ? undefined : "Click rate will populate once recipients engage.",
        },
        {
          label: "Active campaigns",
          value: campaigns.length.toLocaleString(),
          helper: hasCampaigns
            ? "Includes drafts, scheduled, and sent campaigns."
            : "Campaigns appear once a shop is selected and saved.",
        },
      ]}
      footer={
        hasCampaigns ? (
          <p className="text-xs text-muted-foreground">
            Metrics refresh automatically after scheduling or sending a campaign.
          </p>
        ) : undefined
      }
    />
  );
}

export default CampaignMetricsCard;
