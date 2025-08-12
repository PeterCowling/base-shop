"use client";

import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  subject: string;
  sendAt: string;
  metrics: { sent: number; opened: number; clicked: number };
}

export default function EmailMarketingPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  async function load() {
    const res = await fetch("/api/marketing/email");
    if (res.ok) {
      const data = (await res.json()) as Campaign[];
      setCampaigns(data);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch("/api/marketing/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      setStatus(res.ok ? "Sent" : "Failed");
      if (res.ok) {
        setTo("");
        setSubject("");
        setBody("");
        await load();
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
      {campaigns.length > 0 && (
        <table className="w-full text-sm" data-testid="campaign-table">
          <thead>
            <tr>
              <th className="text-left p-2">Subject</th>
              <th className="text-left p-2">Send time</th>
              <th className="text-left p-2">Sent</th>
              <th className="text-left p-2">Opened</th>
              <th className="text-left p-2">Clicked</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.subject}</td>
                <td className="p-2">
                  {new Date(c.sendAt).toLocaleString()}
                </td>
                <td className="p-2">{c.metrics.sent}</td>
                <td className="p-2">{c.metrics.opened}</td>
                <td className="p-2">{c.metrics.clicked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

