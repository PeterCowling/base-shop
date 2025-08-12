"use client";

import { useEffect, useState } from "react";
import { marketingEmailVariants } from "@acme/ui";

interface Campaign {
  id: string;
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  sentAt: string;
  metrics: { sent: number; opened: number; clicked: number };
}

export default function EmailMarketingPage() {
  const [shop, setShop] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState(
    marketingEmailVariants[0].id
  );
  const [status, setStatus] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  async function loadCampaigns(s: string) {
    if (!s) return;
    const res = await fetch(`/api/marketing/email?shop=${encodeURIComponent(s)}`);
    if (res.ok) {
      const json = await res.json();
      setCampaigns(json.campaigns || []);
    }
  }

  useEffect(() => {
    loadCampaigns(shop);
  }, [shop]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch("/api/marketing/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, to, subject, body, templateId }),
      });
      setStatus(res.ok ? "Sent" : "Failed");
      if (res.ok) {
        setTo("");
        setSubject("");
        setBody("");
        await loadCampaigns(shop);
      }
    } catch {
      setStatus("Failed");
    }
  }

  return (
    <div className="space-y-4 p-4">
      <form onSubmit={send} className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="Shop"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Recipient"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <select
          className="border p-2 w-full"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          {marketingEmailVariants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <textarea
          className="border p-2 w-full h-40"
          placeholder="HTML body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button className="border px-4 py-2" type="submit">
          Send
        </button>
        {status && <p>{status}</p>}
      </form>
      {(() => {
        const variant = marketingEmailVariants.find((v) => v.id === templateId);
        if (!variant) return null;
        const Template = variant.component;
        return (
          <div className="max-w-xl border p-4">
            <Template
              headline={subject || ""}
              content={<div dangerouslySetInnerHTML={{ __html: body }} />}
            />
          </div>
        );
      })()}
      {campaigns.length > 0 && (
        <table className="mt-4 w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">Subject</th>
              <th className="border px-2 py-1 text-left">To</th>
              <th className="border px-2 py-1">Sent At</th>
              <th className="border px-2 py-1">Sent</th>
              <th className="border px-2 py-1">Opened</th>
              <th className="border px-2 py-1">Clicked</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="border px-2 py-1">{c.subject}</td>
                <td className="border px-2 py-1">{c.to}</td>
                <td className="border px-2 py-1 text-center">
                  {new Date(c.sentAt).toLocaleString()}
                </td>
                <td className="border px-2 py-1 text-center">{c.metrics.sent}</td>
                <td className="border px-2 py-1 text-center">{c.metrics.opened}</td>
                <td className="border px-2 py-1 text-center">{c.metrics.clicked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
