"use client";

import * as React from "react";

export interface EmailReferralSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  headline?: string;
  subtitle?: string;
  giveLabel?: string; // e.g., "$10 for your friend"
  getLabel?: string; // e.g., "$10 for you"
  termsHref?: string;
  /** Adapter to submit referral. Receive { email, friendEmail }. */
  adapter?: (payload: { email: string; friendEmail: string }) => Promise<{ ok: boolean; message?: string }>;
}

export default function EmailReferralSection({ headline = "Give $10, Get $10", subtitle = "Invite a friend. When they make their first purchase, you both get rewards.", giveLabel = "$10 for your friend", getLabel = "$10 for you", termsHref, adapter, className, ...rest }: EmailReferralSectionProps) {
  const [email, setEmail] = React.useState("");
  const [friend, setFriend] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adapter) return;
    setStatus("loading");
    try {
      const res = await adapter({ email, friendEmail: friend });
      setStatus(res.ok ? "ok" : "error");
      setMessage(res.message);
      if (res.ok) { setEmail(""); setFriend(""); }
    } catch {
      setStatus("error");
      setMessage("Could not submit referral.");
    }
  };

  return (
    <section className={["bg-neutral-50", className].filter(Boolean).join(" ") || undefined} {...rest}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold">{headline}</h2>
        <p className="text-neutral-700">{subtitle}</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">{giveLabel}</span>
          <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">{getLabel}</span>
        </div>
        <form onSubmit={submit} className="mt-2 flex w-full max-w-xl flex-col items-stretch gap-2 sm:flex-row">
          <input type="email" required placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded border px-3 py-2" />
          <input type="email" required placeholder="Friend’s email" value={friend} onChange={(e) => setFriend(e.target.value)} className="flex-1 rounded border px-3 py-2" />
          <button type="submit" disabled={!adapter || status === "loading"} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">Send invite</button>
        </form>
        {termsHref ? (
          <a href={termsHref} className="text-xs text-neutral-600 underline">Terms apply</a>
        ) : null}
        {status === "loading" ? <div className="text-xs text-neutral-600">Sending…</div> : null}
        {status === "ok" ? <div className="text-xs text-emerald-700">Invitation sent{message ? ` — ${message}` : ""}</div> : null}
        {status === "error" ? <div className="text-xs text-red-600">Something went wrong{message ? ` — ${message}` : ""}</div> : null}
      </div>
    </section>
  );
}

