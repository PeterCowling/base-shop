"use client";

import { useState } from "react";

export default function EmailMarketingPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

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
    } catch {
      setStatus("Failed");
    }
  }

  return (
    <form onSubmit={send} className="space-y-2 p-4">
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
  );
}
