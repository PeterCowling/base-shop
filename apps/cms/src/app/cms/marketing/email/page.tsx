"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTimestamp } from "@acme/date-utils";
import {
  marketingEmailTemplates,
  type MarketingEmailTemplateVariant,
} from "@acme/email-templates";
import DOMPurify from "dompurify";
import { MarketingMetricCard } from "../components/MarketingMetricCard";
import { Tag } from "@acme/ui";

interface Campaign {
  id: string;
  recipients: string[];
  subject: string;
  sendAt: string;
  sentAt?: string;
  metrics: { sent: number; opened: number; clicked: number };
  templateId?: string;
  segment?: string | null;
}

interface SegmentSummary {
  id: string;
  name: string;
}

interface CampaignSummary {
  campaignCount: number;
  totals: { sent: number; opened: number; clicked: number };
  averageOpenRate: number;
  averageClickRate: number;
  targetedSegments: number;
  segmentCoverage: number;
}

export default function EmailMarketingPage() {
  const [shop, setShop] = useState("");
  const [recipients, setRecipients] = useState("");
  const [segment, setSegment] = useState("");
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [sendAt, setSendAt] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState(
    marketingEmailTemplates[0]?.id || "",
  );
  const [status, setStatus] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );

  const sanitizedBody = useMemo(
    () => DOMPurify.sanitize(body || "<p>Preview content</p>"),
    [body],
  );

  async function loadCampaigns(s: string) {
    if (!s) {
      setCampaigns([]);
      setSelectedCampaignId(null);
      return;
    }
    setCampaignsLoading(true);
    try {
      const res = await fetch(
        `/api/marketing/email?shop=${encodeURIComponent(s)}`,
      );
      if (res.ok) {
        const json = await res.json();
        setCampaigns(Array.isArray(json.campaigns) ? json.campaigns : []);
      } else {
        setCampaigns([]);
      }
    } catch {
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  }

  async function loadSegments(s: string) {
    if (!s) {
      setSegments([]);
      return;
    }
    setSegmentsLoading(true);
    try {
      const res = await fetch(`/api/segments?shop=${encodeURIComponent(s)}`);
      if (res.ok) {
        const json = await res.json();
        setSegments(Array.isArray(json.segments) ? json.segments : []);
      } else {
        setSegments([]);
      }
    } catch {
      setSegments([]);
    } finally {
      setSegmentsLoading(false);
    }
  }

  useEffect(() => {
    if (!shop) {
      setCampaigns([]);
      setSegments([]);
      setSelectedCampaignId(null);
      return;
    }
    void loadCampaigns(shop);
    void loadSegments(shop);
  }, [shop]);

  useEffect(() => {
    if (campaigns.length === 0) {
      setSelectedCampaignId(null);
      return;
    }
    setSelectedCampaignId((current) => {
      if (current && campaigns.some((c) => c.id === current)) return current;
      return campaigns[0]?.id ?? null;
    });
  }, [campaigns]);

  const summary: CampaignSummary | null = useMemo(() => {
    if (campaigns.length === 0) return null;
    const totals = campaigns.reduce(
      (acc, campaign) => {
        acc.sent += campaign.metrics.sent ?? 0;
        acc.opened += campaign.metrics.opened ?? 0;
        acc.clicked += campaign.metrics.clicked ?? 0;
        return acc;
      },
      { sent: 0, opened: 0, clicked: 0 },
    );
    const targetedSegments = new Set(
      campaigns
        .map((campaign) => campaign.segment || null)
        .filter(Boolean) as string[],
    ).size;
    const averageOpenRate =
      totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;
    const averageClickRate =
      totals.sent > 0 ? (totals.clicked / totals.sent) * 100 : 0;
    const segmentCoverage =
      segments.length > 0
        ? (targetedSegments / segments.length) * 100
        : 0;
    return {
      campaignCount: campaigns.length,
      totals,
      averageOpenRate,
      averageClickRate,
      targetedSegments,
      segmentCoverage,
    };
  }, [campaigns, segments.length]);

  const selectedCampaign = useMemo(
    () =>
      selectedCampaignId
        ? campaigns.find((campaign) => campaign.id === selectedCampaignId) ??
          null
        : null,
    [campaigns, selectedCampaignId],
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch("/api/marketing/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          subject,
          body,
          segment,
          templateId,
          sendAt: sendAt || undefined,
          recipients: recipients
            .split(/[\s,]+/)
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });
      setStatus(res.ok ? "Queued" : "Failed");
      if (res.ok) {
        setRecipients("");
        setSegment("");
        setSendAt("");
        setSubject("");
        setBody("");
        await loadCampaigns(shop);
      }
    } catch {
      setStatus("Failed");
    }
  }

  const selectedSegmentName = selectedCampaign?.segment
    ? segments.find((s) => s.id === selectedCampaign.segment)?.name ||
      selectedCampaign.segment
    : null;

  const campaignStatus = selectedCampaign
    ? selectedCampaign.sentAt
      ? "Sent"
      : new Date(selectedCampaign.sendAt) > new Date()
        ? "Scheduled"
        : "Pending"
    : null;

  const campaignStatusVariant =
    campaignStatus === "Sent" ? "success" : campaignStatus === "Pending" ? "warning" : "default";

  const selectedOpenRate = selectedCampaign
    ? selectedCampaign.metrics.sent > 0
      ? (selectedCampaign.metrics.opened / selectedCampaign.metrics.sent) * 100
      : 0
    : 0;
  const selectedClickRate = selectedCampaign
    ? selectedCampaign.metrics.sent > 0
      ? (selectedCampaign.metrics.clicked / selectedCampaign.metrics.sent) * 100
      : 0
    : 0;

  return (
    <div className="space-y-6 p-4">
      <section className="grid gap-4 md:grid-cols-3">
        <MarketingMetricCard
          title="Active campaigns"
          value={summary ? summary.campaignCount.toLocaleString() : undefined}
          loading={campaignsLoading || segmentsLoading}
          emptyLabel={shop ? "No campaigns yet" : "Select a shop"}
          tag={{
            label: summary
              ? `${summary.targetedSegments}/${segments.length || 0} segments`
              : segments.length > 0
                ? `${segments.length} segments`
                : "Segments needed",
            variant: segments.length > 0 ? "default" : "warning",
          }}
          progress={{
            value:
              summary && segments.length > 0
                ? Math.min(100, summary.segmentCoverage)
                : summary
                  ? 100
                  : 0,
            label:
              summary && segments.length > 0
                ? `${summary.segmentCoverage.toFixed(0)}% segments targeted`
                : undefined,
          }}
          description="Campaign coverage across the segments defined for this shop."
        />
        <MarketingMetricCard
          title="Email opens"
          value={summary ? summary.totals.opened.toLocaleString() : undefined}
          loading={campaignsLoading}
          emptyLabel={shop ? "No engagement yet" : "Select a shop"}
          tag={{
            label: `${(summary?.averageOpenRate ?? 0).toFixed(1)}% open rate`,
            variant:
              summary && summary.averageOpenRate > 30 ? "success" : "default",
          }}
          progress={{
            value: summary ? Math.min(100, summary.averageOpenRate) : 0,
            label: summary
              ? `${summary.totals.sent.toLocaleString()} sent`
              : undefined,
          }}
          description="Average opens across delivered campaigns."
        />
        <MarketingMetricCard
          title="Email clicks"
          value={summary ? summary.totals.clicked.toLocaleString() : undefined}
          loading={campaignsLoading}
          emptyLabel={shop ? "No clicks yet" : "Select a shop"}
          tag={{
            label: `${(summary?.averageClickRate ?? 0).toFixed(1)}% click rate`,
            variant:
              summary && summary.averageClickRate > 5 ? "success" : "default",
          }}
          progress={{
            value: summary ? Math.min(100, summary.averageClickRate) : 0,
            label: summary
              ? `${summary.totals.opened.toLocaleString()} opens`
              : undefined,
          }}
          description="Average click-through performance for active campaigns."
        />
      </section>

      <form onSubmit={send} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder="Shop"
          value={shop}
          onChange={(event) => setShop(event.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Recipients (comma separated)"
          value={recipients}
          onChange={(event) => setRecipients(event.target.value)}
        />
        <select
          className="w-full border p-2"
          value={segment}
          onChange={(event) => setSegment(event.target.value)}
        >
          <option value="">Select segment</option>
          {segments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="w-full border p-2"
          value={sendAt}
          onChange={(event) => setSendAt(event.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <select
          className="w-full border p-2"
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
        >
          {marketingEmailTemplates.map((template: MarketingEmailTemplateVariant) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
        <textarea
          className="h-40 w-full border p-2"
          placeholder="HTML body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <button className="border px-4 py-2" type="submit">
          Send
        </button>
        {status && <p>{status}</p>}
      </form>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Campaign history</h2>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">Subject</th>
              <th className="border px-2 py-1 text-left">Recipients</th>
              <th className="border px-2 py-1">Send At</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Sent</th>
              <th className="border px-2 py-1">Opened</th>
              <th className="border px-2 py-1">Clicked</th>
            </tr>
          </thead>
          <tbody>
            {campaignsLoading ? (
              <tr>
                <td className="px-2 py-3 text-center" colSpan={7}>
                  Loading campaigns…
                </td>
              </tr>
            ) : campaigns.length > 0 ? (
              campaigns.map((campaign) => {
                const isSelected = selectedCampaignId === campaign.id;
                const statusLabel = campaign.sentAt
                  ? "Sent"
                  : new Date(campaign.sendAt) > new Date()
                    ? "Scheduled"
                    : "Pending";
                return (
                  <tr
                    key={campaign.id}
                    className={`cursor-pointer border ${
                      isSelected ? "bg-gray-50" : ""
                    }`}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                  >
                    <td className="border px-2 py-1">{campaign.subject}</td>
                    <td className="border px-2 py-1">
                      {campaign.recipients.join(", ")}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {formatTimestamp(campaign.sendAt)}
                    </td>
                    <td className="border px-2 py-1 text-center">{statusLabel}</td>
                    <td className="border px-2 py-1 text-center">
                      {campaign.metrics.sent}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {campaign.metrics.opened}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {campaign.metrics.clicked}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-2 py-3 text-center" colSpan={7}>
                  {shop ? "No campaigns." : "Select a shop to view campaigns."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selectedCampaign ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">
              Campaign details: {selectedCampaign.subject}
            </h3>
            {campaignStatus ? (
              <Tag variant={campaignStatusVariant} className="text-xs font-medium">
                {campaignStatus}
              </Tag>
            ) : null}
            {selectedSegmentName ? (
              <Tag variant="default" className="text-xs font-medium">
                Segment: {selectedSegmentName}
              </Tag>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <MarketingMetricCard
              title="Emails sent"
              value={selectedCampaign.metrics.sent.toLocaleString()}
              tag={{
                label: `${selectedCampaign.recipients.length} recipients`,
                variant:
                  selectedCampaign.recipients.length > 0 ? "default" : "warning",
              }}
              progress={{
                value: selectedCampaign.sentAt ? 100 : 0,
                label: selectedCampaign.sentAt
                  ? `Sent ${formatTimestamp(selectedCampaign.sentAt)}`
                  : selectedCampaign.sendAt
                    ? `Scheduled ${formatTimestamp(selectedCampaign.sendAt)}`
                    : "Queued",
              }}
              description="Delivery volume and scheduling details for this campaign."
            />
            <MarketingMetricCard
              title="Opens"
              value={selectedCampaign.metrics.opened.toLocaleString()}
              tag={{
                label: `${selectedOpenRate.toFixed(1)}% open rate`,
                variant: selectedOpenRate > 30 ? "success" : "default",
              }}
              progress={{
                value: Math.min(100, selectedOpenRate),
                label: `${selectedCampaign.metrics.sent.toLocaleString()} sent`,
              }}
              emptyLabel="No opens yet"
            />
            <MarketingMetricCard
              title="Clicks"
              value={selectedCampaign.metrics.clicked.toLocaleString()}
              tag={{
                label: `${selectedClickRate.toFixed(1)}% click rate`,
                variant: selectedClickRate > 5 ? "success" : "default",
              }}
              progress={{
                value: Math.min(100, selectedClickRate),
                label: `${selectedCampaign.metrics.opened.toLocaleString()} opens`,
              }}
              emptyLabel="No clicks yet"
            />
          </div>
        </section>
      ) : null}

      <div className="rounded border p-4">
        {marketingEmailTemplates
          .find((template) => template.id === templateId)
          ?.make({
            headline: subject || "",
            content: (
              <div dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
            ),
          })}
      </div>
    </div>
  );
}
