"use client";

import { useEffect, useState } from "react";
import { formatTimestamp } from "@acme/date-utils";
import {
  marketingEmailTemplates,
  type MarketingEmailTemplateVariant,
} from "@acme/ui";
import DOMPurify from "dompurify";

interface Campaign {
  id: string;
  recipients: string[];
  subject: string;
  sendAt: string;
  sentAt?: string;
  metrics: { sent: number; opened: number; clicked: number };
  templateId?: string;
}

export default function EmailMarketingPage() {
  const [shop, setShop] = useState("");
  const [recipients, setRecipients] = useState("");
  const [segment, setSegment] = useState("");
  const [segments, setSegments] = useState<{ id: string; name: string }[]>([]);
  const [sendAt, setSendAt] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState(
    marketingEmailTemplates[0]?.id || ""
  );
    const [status, setStatus] = useState<string | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  async function loadCampaigns(s: string) {
    if (!s) return;
    const res = await fetch(
      `/api/marketing/email?shop=${encodeURIComponent(s)}`
    );
    if (res.ok) {
      const json = await res.json();
      setCampaigns(json.campaigns || []);
    }
  }

  useEffect(() => {
    loadCampaigns(shop);
    loadSegments(shop);
  }, [shop]);

  async function loadSegments(s: string) {
    if (!s) return;
    const res = await fetch(`/api/segments?shop=${encodeURIComponent(s)}`);
    if (res.ok) {
      const json = await res.json();
      setSegments(json.segments || []);
    }
  }

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
            .split(/[,\s]+/)
            .map((r) => r.trim())
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

    const sanitizedBody = DOMPurify.sanitize(
      body || "<p>Preview content</p>"
    );

    return (
      <div className="space-y-4 p-4">
      <form onSubmit={send} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder="Shop"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Recipients (comma separated)"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
        />
        <select
          className="w-full border p-2"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
        >
          <option value="">Select segment</option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="w-full border p-2"
          value={sendAt}
          onChange={(e) => setSendAt(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <select
          className="w-full border p-2"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          {marketingEmailTemplates.map((t: MarketingEmailTemplateVariant) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <textarea
          className="h-40 w-full border p-2"
          placeholder="HTML body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button className="border px-4 py-2" type="submit">
          Send
        </button>
        {status && <p>{status}</p>}
      </form>
      {campaigns.length > 0 && (
        <table className="mt-4 w-full border">
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
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="border px-2 py-1">{c.subject}</td>
                <td className="border px-2 py-1">{c.recipients.join(", ")}</td>
                <td className="border px-2 py-1 text-center">
                  {formatTimestamp(c.sendAt)}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.sentAt
                    ? "Sent"
                    : new Date(c.sendAt) > new Date()
                      ? "Scheduled"
                      : "Pending"}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.metrics.sent}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.metrics.opened}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.metrics.clicked}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
        <div className="mt-4">
          {marketingEmailTemplates
            .find((t: MarketingEmailTemplateVariant) => t.id === templateId)
            ?.render({
              headline: subject || "",
              content: (
                <div dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
              ),
            })}
        </div>
      </div>
    );
  }
