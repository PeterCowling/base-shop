"use client";

import Link from "next/link";
import { useState } from "react";
import { Toast } from "@/components/atoms";

interface Issue {
  id: string;
  title: string;
  href: string;
  detail?: string;
}

interface Props {
  shop: string;
  issues: Issue[];
}

export default function SeoIssuesBanner({ shop, issues }: Props) {
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const sendReminder = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/seo/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop }),
      });
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }
      setToast({ open: true, message: "Reminder sent" });
    } catch {
      setToast({ open: true, message: "Failed to send reminder" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-warning/30 bg-warning-soft p-4 text-sm text-warning-foreground shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">SEO to-dos</p>
          <button
            type="button"
            className="ms-auto inline-flex items-center rounded bg-warning/20 px-2 py-1 text-xs font-medium text-warning underline decoration-2 underline-offset-2"
            onClick={sendReminder}
            disabled={sending}
          >
            {sending ? "Sending…" : "Send reminder"}
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {issues.map((issue) => (
            <li key={issue.id} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning-foreground">
                Action needed
              </span>
              <span className="font-medium">{issue.title}</span>
              {issue.detail && <span className="text-warning">— {issue.detail}</span>}
              <Link
                href={issue.href}
                className="ms-auto inline-flex text-warning underline decoration-2 underline-offset-2"
              >
                Go fix
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Toast open={toast.open} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
    </>
  );
}
